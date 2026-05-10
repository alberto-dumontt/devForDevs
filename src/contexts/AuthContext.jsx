import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password, metadata = {}) =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: import.meta.env.VITE_SITE_URL ?? window.location.origin,
      },
    });

  const signInWithGitHub = () =>
    supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.origin } });

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });

  const signOut = () => supabase.auth.signOut();

  const updateProfile = async (data) => {
    const { setup_complete, ...profileData } = data;

    // Keep setup_complete flag in user_metadata so the guard works without a DB query
    if (setup_complete !== undefined) {
      const { error } = await supabase.auth.updateUser({ data: { setup_complete } });
      if (error) return { error };
    }

    // Persist profile fields to the profiles table
    return supabase
      .from('profiles')
      .upsert({ id: user.id, ...profileData }, { onConflict: 'id' });
  };

  // true when user is logged in but hasn't completed profile setup
  const needsProfileSetup = !!user && !user.user_metadata?.setup_complete;

  return (
    <AuthContext.Provider value={{ user, loading, needsProfileSetup, signIn, signUp, signInWithGitHub, signInWithGoogle, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
