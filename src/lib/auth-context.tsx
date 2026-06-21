import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "student";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  status: ApprovalStatus;
  rejection_reason: string | null;
}

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

async function loadProfileAndRole(userId: string) {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  const role = roles?.find((r) => r.role === "admin")
    ? ("admin" as AppRole)
    : roles && roles.length > 0
      ? ("student" as AppRole)
      : null;
  return { profile: (profile as Profile | null) ?? null, role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);

  const hydrate = async (s: Session | null) => {
    setSession(s);
    setUser(s?.user ?? null);
    if (s?.user) {
      const { profile, role } = await loadProfileAndRole(s.user.id);
      setProfile(profile);
      setRole(role);
    } else {
      setProfile(null);
      setRole(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Defer to avoid deadlock
      setTimeout(() => { void hydrate(s); }, 0);
    });
    supabase.auth.getSession().then(({ data }) => { void hydrate(data.session); });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const refresh = async () => {
    if (user) {
      const { profile, role } = await loadProfileAndRole(user.id);
      setProfile(profile);
      setRole(role);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null); setUser(null); setProfile(null); setRole(null);
  };

  return (
    <AuthContext.Provider value={{ loading, session, user, profile, role, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}