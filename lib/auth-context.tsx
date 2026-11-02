'use client';

import * as React from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface Profile {
  display_name: string;
  default_input_language: string;
  default_output_language: string;
  default_tone: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isDemo: boolean;
  signIn: (email: string, password?: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<{ error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = 'aawaz_demo_user';
const DEMO_PROFILE_KEY = 'aawaz_demo_profile';

const DEFAULT_PROFILE: Profile = {
  display_name: 'Guest User',
  default_input_language: 'auto',
  default_output_language: 'en-IN',
  default_tone: 'formal',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const isDemo = !isSupabaseConfigured();

  const supabase = React.useMemo(() => {
    return isDemo ? null : createClient();
  }, [isDemo]);

  const loadProfile = React.useCallback(async (userId: string) => {
    if (isDemo || !supabase) {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(DEMO_PROFILE_KEY);
        setProfile(stored ? JSON.parse(stored) : DEFAULT_PROFILE);
      }
      return;
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setProfile({
          display_name: data.display_name || 'User',
          default_input_language: data.default_input_language || 'auto',
          default_output_language: data.default_output_language || 'en-IN',
          default_tone: data.default_tone || 'formal',
        });
      } else {
        setProfile(DEFAULT_PROFILE);
      }
    } catch {
      setProfile(DEFAULT_PROFILE);
    }
  }, [isDemo, supabase]);

  const refreshUser = React.useCallback(async () => {
    if (isDemo || !supabase) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(DEMO_USER_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          await loadProfile(parsed.id);
        } else {
          // Default guest user for demo mode
          const guest: AuthUser = {
            id: 'demo-user-1',
            email: 'demo@sarvam.ai',
            fullName: 'Guest Speaker',
          };
          setUser(guest);
          await loadProfile(guest.id);
        }
      }
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const u = session.user;
        setUser({
          id: u.id,
          email: u.email || '',
          fullName: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
        });
        await loadProfile(u.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [isDemo, supabase, loadProfile]);

  React.useEffect(() => {
    refreshUser();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              fullName:
                session.user.user_metadata?.full_name ||
                session.user.email?.split('@')[0] ||
                'User',
            });
            await loadProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
          setIsLoading(false);
        }
      );
      return () => subscription.unsubscribe();
    }
  }, [supabase, refreshUser, loadProfile]);

  const signIn = async (email: string, password?: string) => {
    if (isDemo || !supabase) {
      const demoUser: AuthUser = {
        id: 'demo-user-1',
        email,
        fullName: email.split('@')[0],
      };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      await loadProfile(demoUser.id);
      return {};
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: password || '',
    });

    if (error) return { error: error.message };
    await refreshUser();
    return {};
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (isDemo || !supabase) {
      const demoUser: AuthUser = {
        id: 'demo-user-1',
        email,
        fullName,
      };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      localStorage.setItem(
        DEMO_PROFILE_KEY,
        JSON.stringify({ ...DEFAULT_PROFILE, display_name: fullName })
      );
      setUser(demoUser);
      setProfile({ ...DEFAULT_PROFILE, display_name: fullName });
      return {};
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) return { error: error.message };
    await refreshUser();
    return {};
  };

  const signOut = async () => {
    if (isDemo || !supabase) {
      localStorage.removeItem(DEMO_USER_KEY);
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (newProfile: Partial<Profile>) => {
    const updated = { ...(profile || DEFAULT_PROFILE), ...newProfile };
    if (isDemo || !supabase || !user) {
      localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(updated));
      setProfile(updated);
      return {};
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...newProfile,
      });

    if (error) return { error: error.message };
    setProfile(updated);
    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isDemo,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
