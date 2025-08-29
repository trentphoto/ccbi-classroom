"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types/db';
import { createClient } from '@/lib/supabase/client';
import { db } from '@/lib/supabase/database';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Load user on mount
  useEffect(() => {
    loadUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserFromSession(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setError('Failed to load user session');
        return;
      }

      if (session?.user) {
        await loadUserFromSession(session.user);
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load user');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserFromSession = async (authUser: any) => {
    try {
      // Try to get user from our database first
      const dbUser = await db.getUserById(authUser.id);

      if (dbUser) {
        // Check if user is active (for students)
        if (dbUser.role === UserRole.STUDENT && !dbUser.is_active) {
          console.error('Inactive student attempting to login:', dbUser.email);
          setError('Your account has been deactivated. Please contact your administrator.');
          
          // Sign out the user since they can't access the system
          await supabase.auth.signOut();
          setUser(null);
          return;
        }
        
        setUser(dbUser);
      } else {
        // User exists in Supabase Auth but not in our users table
        // This is a configuration issue - user needs to be added to the users table by an admin
        console.error('User authenticated but not found in users table:', authUser.email);
        setError('Your account is not properly configured. Please contact your administrator.');
        
        // Sign out the user since they can't access the system
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (err) {
      console.error('Error loading user from session:', err);
      setError('Failed to load user profile. Please contact your administrator.');
      
      // Sign out the user on error
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        // Provide more user-friendly error messages
        let errorMessage = 'Invalid email or password';
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (authError.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account';
        } else if (authError.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please try again later';
        }
        throw new Error(errorMessage);
      }

      if (data.user) {
        await loadUserFromSession(data.user);
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: authError } = await supabase.auth.signOut();

      if (authError) {
        console.error('Logout error:', authError);
        setError('Failed to logout');
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
