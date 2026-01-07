import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';

interface User {
  id: string;
  email?: string;
  name?: string;
  role: 'admin' | 'dispatcher';
  assigned_fermata_ids: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isDispatcher: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  const loadUserProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, assigned_fermata_ids')
      .eq('id', uid)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Profile load error:', error);
    }

    if (data) {
      setUser(data);
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

const login = async (email: string, password: string): Promise<boolean> => {
  setIsLoading(true);

  try {
    const response = await fetch('https://jbryrzuskgbfzvynbwpn.supabase.co/functions/v1/smooth-processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const result = await response.json();

    if (result.success && result.user) {
      setUser(result.user);
      toast.success('Welcome back!');
      return true;
    } else {
      toast.error('Invalid email or password');
      return false;
    }
  } catch (err) {
    toast.error('Login failed — check internet');
    console.error(err);
    return false;
  } finally {
    setIsLoading(false);
  }
};

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isDispatcher: user?.role === 'dispatcher',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
