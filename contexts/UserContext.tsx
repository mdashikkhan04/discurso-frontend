"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { onIdTokenChanged, getUserRole, logoutUser } from "@/lib/client/auth";
import { clearSession, updateSession, validateSession } from "@/actions/auth";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();


  useEffect(() => {
    let intervalId;

    const syncSession = async () => {
      const authUser: any = await new Promise((resolve) => {
        const unsubscribe = onIdTokenChanged((user) => {
          resolve(user);
          unsubscribe(); // unsubscribe immediately after getting user
        });
      });

      if (authUser) {
        try {
          const token = await authUser.getIdToken(true);
          await updateSession(token);
          setUser(authUser);
          setRole(getUserRole(authUser));
        } catch (e) {
          console.warn("Failed to sync session:", e);
        }
      } else {
        await logout();
      }

      setLoading(false);
    };

    // run immediately once
    syncSession();

    // then run every 10 seconds
    intervalId = setInterval(syncSession, 5000);

    return () => clearInterval(intervalId);
  }, [pathname]);

  const logout = async () => {
    setUser(null);
    setRole(null);
    await logoutUser();
    await clearSession();
  };

  return (
    <UserContext.Provider
      value={{ user, role, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
