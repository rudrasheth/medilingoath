import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '@/lib/config';

interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: 'Male' | 'Female';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, age: number, name: string, gender?: 'Male' | 'Female') => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  checkAuthStatus: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('medilingo_user');
    const token = localStorage.getItem('medilingo_token');
    console.log('🔄 AuthProvider init - User:', savedUser ? 'Found' : 'None');
    console.log('🔄 AuthProvider init - Token:', token ? 'Found' : 'None');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const isAuthenticated = user !== null;

  useEffect(() => {
    if (user) {
      localStorage.setItem('medilingo_user', JSON.stringify(user));
      // Also check if we have a token
      const token = localStorage.getItem('medilingo_token');
      if (!token) {
        console.warn('⚠️ User exists but no token found - user may need to re-login');
      }
    } else {
      localStorage.removeItem('medilingo_user');
      localStorage.removeItem('medilingo_token');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email);
      console.log('🌐 API URL:', `${API_BASE_URL}/api/auth/login`);
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('✅ Login successful:', data.user);
      console.log('🔑 Token received:', data.token ? 'Yes' : 'No');
      
      // Store the JWT token
      if (data.token) {
        localStorage.setItem('medilingo_token', data.token);
        console.log('💾 Token stored in localStorage');
      } else {
        console.error('❌ No token in response!');
      }
      
      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        age: data.user.age,
        gender: data.user.gender,
      };
      
      setUser(userData);
      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.user.name}!`,
      });
    } catch (error: any) {
      console.error('❌ Login error:', error);
      toast({
        title: 'Login failed',
        description: error.message || 'Failed to connect to server',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signup = async (email: string, password: string, age: number, name: string, gender?: 'Male' | 'Female') => {
    try {
      console.log('📝 Attempting signup for:', email);
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, age, name, gender }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Signup failed');
      }

      const data = await response.json();
      console.log('✅ Signup successful:', data.user);
      console.log('🔑 Token received:', data.token ? 'Yes' : 'No');
      
      // Store the JWT token
      if (data.token) {
        localStorage.setItem('medilingo_token', data.token);
        console.log('💾 Token stored in localStorage');
      } else {
        console.error('❌ No token in response!');
      }
      
      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        age: data.user.age,
        gender: data.user.gender,
      };
      
      setUser(userData);
      toast({
        title: 'Account created successfully',
        description: `Welcome to MediLingo, ${data.user.name}!`,
      });
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      toast({
        title: 'Signup failed',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('medilingo_token');
    localStorage.removeItem('medilingo_user');
    toast({
      title: 'Logged out',
      description: 'See you next time!',
    });
  };

  const forgotPassword = async (email: string) => {
    try {
      console.log('🔑 Requesting password reset for:', email);
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send reset email');
      }

      const data = await response.json();
      console.log('✅ Reset email sent:', data.message);
      toast({
        title: 'Reset email sent',
        description: 'Check your email for OTP and instructions',
      });
    } catch (error: any) {
      console.error('❌ Forgot password error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process password reset',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    try {
      console.log('🔄 Resetting password for:', email);
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, otp, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      const data = await response.json();
      console.log('✅ Password reset successful:', data.message);
      toast({
        title: 'Password reset successfully',
        description: 'You can now login with your new password',
      });
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const checkAuthStatus = () => {
    const token = localStorage.getItem('medilingo_token');
    const savedUser = localStorage.getItem('medilingo_user');
    
    if (!token || !savedUser) {
      console.warn('⚠️ Missing token or user data - forcing logout');
      setUser(null);
      localStorage.removeItem('medilingo_token');
      localStorage.removeItem('medilingo_user');
      return false;
    }
    
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout, forgotPassword, resetPassword, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
