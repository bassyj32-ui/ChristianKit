import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isProUser: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProUser, setIsProUser] = useState(false);

  // Check for existing user in localStorage on mount
  useEffect(() => {
    console.log('AuthProvider: Checking for saved user...');
    
    const savedUser = localStorage.getItem('user');
    console.log('AuthProvider: Saved user:', savedUser);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsProUser(true); // For demo purposes, treat all users as Pro
        console.log('AuthProvider: User loaded from localStorage');
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user'); // Clear corrupted data
      }
    } else {
      console.log('AuthProvider: No saved user found');
    }
    setLoading(false); // Ensure loading is set to false
    console.log('AuthProvider: Loading set to false');
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate Google sign-in for development
      const mockUser: User = {
        uid: 'demo-user-' + Date.now(),
        email: 'demo@christiankit.app',
        displayName: 'Demo User',
        photoURL: 'https://via.placeholder.com/150'
      };
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      setIsProUser(true);
      
      console.log('Demo user signed in:', mockUser);
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('user');
      setUser(null);
      setIsProUser(false);
      console.log('User signed out');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    isProUser,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
