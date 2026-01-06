import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { type User, type Session } from '@supabase/supabase-js';

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session immediately
    const initAuth = async () => {
      // Check if we have a session in local storage or URL
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error getting session:", error);
      }

      if (session) {
        console.log("Session found on init:", session.user.email);
        setSession(session);
        setCurrentUser(session.user);
        setLoading(false);
      } else {
        // 2. If no session, check if we just came back from a redirect (URL has fragments)
        // Sometimes getSession() misses the hash on first load in some environments
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
            console.log("Hash found, waiting for onAuthStateChange to catch it...");
            // Do NOT set loading to false yet, let the listener handle it
        } else {
            setLoading(false);
        }
      }
    };

    initAuth();

    // 3. Listen for changes (Login, Logout, Auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email); 
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false,
        }
      });
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
        console.log("AuthContext: Manual refresh requested");
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
            console.log("AuthContext: Session found on refresh:", session.user.email);
            setSession(session);
            setCurrentUser(session.user);
        } else {
            console.log("AuthContext: No session found on refresh");
        }
        return session;
    } catch (error) {
        console.error("AuthContext: Error refreshing session", error);
        return null;
    }
  };

  const value = {
    currentUser,
    session,
    loading,
    signInWithGoogle,
    logout,
    refreshSession
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
