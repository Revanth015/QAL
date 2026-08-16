import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../config/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUserProfile(userId) {
    if (!userId) {
      setUserProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        total_xp,
        level,
        streak,
        missions_completed,
        role
      `)
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load user profile:", error);
      setUserProfile(null);
      return;
    }

    setUserProfile(data);
  }

  useEffect(() => {
    async function initializeAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user?.id) {
        await loadUserProfile(session.user.id);
      }

      setLoading(false);
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user?.id) {
        await loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        userProfile,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}