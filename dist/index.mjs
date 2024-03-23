"use client";
import { verify, sign } from "jsonwebtoken";
import { useCookieState } from "ahooks";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth/dist/index.esm.js";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "api";
import { useRouter } from "next/navigation.js";
const key = process.env.NEXT_PUBLIC_JWT_SECRET;
const parseSession = (session) => {
  if (session && key) {
    const ssn = verify(session, key);
    if (ssn) {
      return ssn;
    } else
      return null;
  } else
    return null;
};
const getEmptySession = () => {
  const emptySession = {
    activeUid: null,
    members: []
  };
  return emptySession;
};
const prepareSession = (session) => {
  const preparedSession = key ? sign(session, key) : "";
  return preparedSession;
};
const syncAuth = async (auth$1, session, user) => {
  const travelToken = session.activeUid ? await auth.travel(session.activeUid) : null;
  if (session && session.activeUid && user && travelToken) {
    if (session.activeUid !== user.uid) {
      await signInWithCustomToken(auth$1, travelToken);
      return session;
    }
    return session;
  }
  if (session && session.activeUid && !user && travelToken) {
    await signInWithCustomToken(auth$1, travelToken);
    return session;
  }
  if (session && !session.activeUid && user) {
    await auth$1.signOut();
    return session;
  }
  return session;
};
const domain = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "development" ? "localhost" : ".darkmaterial.space" : "localhost";
const isDev = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "development" : false;
const useSession = (auth2) => {
  const [uid, setUid] = useCookieState("uid", {
    defaultValue: "",
    domain,
    secure: isDev ? false : true,
    sameSite: "lax"
  });
  const [session, setSession] = useCookieState("SSN", {
    defaultValue: "",
    domain,
    secure: isDev ? false : true,
    sameSite: "lax"
  });
  const [user, loading] = useAuthState(auth2);
  const parsedSession = parseSession(session);
  const router = useRouter();
  const controls = (type, uid2) => {
    if (!uid2)
      return void 0;
    if (type === "add" && parsedSession) {
      const updatedSession = {
        ...parsedSession,
        activeUid: uid2,
        members: !parsedSession.members.includes(uid2) ? [...parsedSession.members, uid2] : parsedSession.members
      };
      const updated = prepareSession(updatedSession);
      setSession(updated);
      syncAuth(auth2, updatedSession, user);
    } else if (type === "update" && parsedSession) {
      const updatedSession = {
        ...parsedSession,
        activeUid: parsedSession.activeUid && parsedSession.activeUid === uid2 ? null : uid2,
        members: !parsedSession.members.includes(uid2) ? [...parsedSession.members, uid2] : parsedSession.members
      };
      const updated = prepareSession(updatedSession);
      setSession(updated);
      syncAuth(auth2, updatedSession, user);
    } else if (type === "delete" && parsedSession) {
      const updatedSession = {
        ...parsedSession,
        activeUid: parsedSession.activeUid && parsedSession.activeUid === uid2 ? null : parsedSession.activeUid,
        members: parsedSession.members.filter((member) => member !== uid2)
      };
      const updated = prepareSession(updatedSession);
      setSession(updated);
      syncAuth(auth2, updatedSession, user);
    }
  };
  const initSession = () => {
    const emptySession = getEmptySession();
    const session2 = prepareSession(emptySession);
    setSession(session2);
  };
  useEffect(() => {
    if (isDev)
      console.log(parsedSession, !!user);
    if (!loading) {
      if (parsedSession) {
        syncAuth(auth2, parsedSession, user);
        if (user)
          user.reload();
        if (parsedSession.activeUid) {
          router.refresh();
          setUid(parsedSession.activeUid);
        }
      } else {
        setUid("");
        initSession();
      }
    }
  }, [parsedSession, auth2, loading, user]);
  return [parsedSession, controls, user];
};
export {
  useSession
};
