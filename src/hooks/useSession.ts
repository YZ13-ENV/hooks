'use client'
import { sign, verify } from 'jsonwebtoken'
import { useCookieState } from "ahooks"
import { useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { Auth, User, signInWithCustomToken } from 'firebase/auth'
import { auth as authAPI } from 'api'

type Controls = 'add' | 'update' | 'delete'
type Session = {
  activeUid: string | null
  members: string[]
}

const key = process.env.NEXT_PUBLIC_JWT_SECRET
const parseSession = (session: string): Session | null => {
  if (session && key) {
    const ssn = verify(session, key)
    if (ssn) {
      return ssn as Session
    } else return null
  } else return null
}

const getEmptySession = () => {
  const emptySession: Session = {
    activeUid: null,
    members: []
  }
  return emptySession
}

const prepareSession = (session: Session) => {

  const preparedSession = key ? sign(session, key) : ''
  return preparedSession
}

const syncAuth = async(auth: Auth, session: Session, user: User | null | undefined) => {
  const travelToken = session.activeUid ? await authAPI.travel(session.activeUid) : null
  if (session && session.activeUid && user && travelToken) {
    if (session.activeUid !== user.uid) {
      await signInWithCustomToken(auth, travelToken)
      return session
    } return session
  }
  if (session && session.activeUid && !user && travelToken) {
    await signInWithCustomToken(auth, travelToken)
    return session
  }
  if (session && !session.activeUid && user) {
    await auth.signOut()
    return session
  }
  return session
}

const domain = process.env.VERCEL_ENV === 'development' ? 'localhost' : '.darkmaterial.space'

export const useSession = (auth: Auth): [Session | null, (type: Controls, uid: string) => void, User | null | undefined] => {
  const [uid, setUid] = useCookieState('uid', { defaultValue: '', domain: domain, secure: true, sameSite: 'lax' })
  const [session, setSession] = useCookieState('SSN', { defaultValue: '', domain: domain, secure: true, sameSite: 'lax' })
  const [user, loading] = useAuthState(auth)
  const parsedSession = parseSession(session as string)

  const controls = (type: Controls, uid: string) => {
    if (!uid) return undefined
    // controls type -> 'add' 'update' 'delete'
    // add - добавление пользователя в сессию
    // update - обновление текущего пользователя
    // delete - удаление пользователя из сессии + если он активный, тогда + удаление активного пользователя
    if (type === 'add' && parsedSession) {
      const updatedSession: Session = {
        ...parsedSession,
        activeUid: uid,
        members: !parsedSession.members.includes(uid) ? [...parsedSession.members, uid] : parsedSession.members
      }
      const updated = prepareSession(updatedSession)
      setSession(updated)
      syncAuth(auth, updatedSession, user)
    } else if (type === 'update' && parsedSession) {
      const updatedSession: Session = {
        ...parsedSession,
        activeUid: parsedSession.activeUid && parsedSession.activeUid === uid ? null : uid,
        members: !parsedSession.members.includes(uid) ? [...parsedSession.members, uid] : parsedSession.members
      }
      const updated = prepareSession(updatedSession)
      setSession(updated)
      syncAuth(auth, updatedSession, user)
    } else if (type === 'delete' && parsedSession) {
      const updatedSession: Session = {
        ...parsedSession,
        activeUid: parsedSession.activeUid && parsedSession.activeUid === uid ? null : parsedSession.activeUid,
        members: parsedSession.members.filter(member => member !== uid)
      }
      const updated = prepareSession(updatedSession)
      setSession(updated)
      syncAuth(auth, updatedSession, user)
    }
  }
  const initSession = () => {
    const emptySession = getEmptySession()
    const session = prepareSession(emptySession)
    setSession(session)
  }
  useEffect(() => {
    if (!loading) {
      if (parsedSession) {
        syncAuth(auth, parsedSession, user)
        if (parsedSession.activeUid) setUid(parsedSession.activeUid)
      } else {
        setUid('')
        initSession()
      }
    }
  },[parsedSession, auth, loading])
  return [parsedSession, controls, user]
}