(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("jsonwebtoken"), require("ahooks"), require("react"), require("react-firebase-hooks/auth/dist/index.esm.js"), require("firebase/auth"), require("api"), require("next/navigation.js")) : typeof define === "function" && define.amd ? define(["exports", "jsonwebtoken", "ahooks", "react", "react-firebase-hooks/auth/dist/index.esm.js", "firebase/auth", "api", "next/navigation.js"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.hooks = {}, global.jsonwebtoken, global.ahooks, global.react, global["react-firebase-hooks/auth"], global["firebase/auth"], global.api, global.navigation_js));
})(this, function(exports2, jsonwebtoken, ahooks, react, index_esm_js, auth, api, navigation_js) {
  "use strict";"use client";

  const key = process.env.NEXT_PUBLIC_JWT_SECRET;
  const parseSession = (session) => {
    if (session && key) {
      const ssn = jsonwebtoken.verify(session, key);
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
    const preparedSession = key ? jsonwebtoken.sign(session, key) : "";
    return preparedSession;
  };
  const syncAuth = async (auth$1, session, user) => {
    const travelToken = session.activeUid ? await api.auth.travel(session.activeUid) : null;
    if (session && session.activeUid && user && travelToken) {
      if (session.activeUid !== user.uid) {
        await auth.signInWithCustomToken(auth$1, travelToken);
        return session;
      }
      return session;
    }
    if (session && session.activeUid && !user && travelToken) {
      await auth.signInWithCustomToken(auth$1, travelToken);
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
    const [uid, setUid] = ahooks.useCookieState("uid", {
      defaultValue: "",
      domain,
      secure: isDev ? false : true,
      sameSite: "lax"
    });
    const [session, setSession] = ahooks.useCookieState("SSN", {
      defaultValue: "",
      domain,
      secure: isDev ? false : true,
      sameSite: "lax"
    });
    const [user, loading] = index_esm_js.useAuthState(auth2);
    const parsedSession = parseSession(session);
    const router = navigation_js.useRouter();
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
    react.useEffect(() => {
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
  exports2.useSession = useSession;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
