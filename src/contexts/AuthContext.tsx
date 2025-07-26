import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import { clearAuthData, getAuthToken, getUserData, setAuthData, isValidToken } from '@/utils/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  idCardUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'student' | 'admin', idCard?: File | null) => Promise<void>;
  logout: () => void;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken();
      const userData = getUserData();
      
      if (token && userData) {
        // Check if token is valid format
        if (!isValidToken(token)) {
          clearAuthData();
          setLoading(false);
          return;
        }

        try {
          // Verify token with backend
          const response = await authAPI.verifyToken();
          const backendUserData = response.data.user;
          
          setUser({
            id: backendUserData._id,
            email: backendUserData.email,
            name: backendUserData.name,
            role: backendUserData.role
          });
        } catch (error) {
          // Token is invalid, clear it
          clearAuthData();
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('🔐 Attempting login for:', email);
      console.log('🌐 API Base URL:', import.meta.env.VITE_API_BASE_URL || 'https://campues-connect-backend.onrender.com/api');
      
      const response = await authAPI.login(email, password);
      console.log('✅ Login response received:', response.status);
      
      const { token, user: userData, verificationStatus } = response.data;
      console.log('📝 User data received:', { email: userData.email, role: userData.role, verificationStatus });
      
      // Check if user has verification status issues
      if (verificationStatus === 'pending') {
        throw new Error('Your account is pending verification. Please wait for admin approval.');
      }
      
      if (verificationStatus === 'rejected') {
        throw new Error('Your account verification was rejected. Please contact the administrator.');
      }
      
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        verificationStatus: userData.verificationStatus,
        idCardUrl: userData.idCardUrl
      };

      setAuthData(token, user);
      setUser(user);
      console.log('🎉 Login successful');
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('📊 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      const message = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'student' | 'admin', idCard?: File | null) => {
    setLoading(true);
    try {
      console.log('📝 Attempting signup for:', email, 'as', role);
      console.log('🌐 API Base URL:', import.meta.env.VITE_API_BASE_URL || 'https://campues-connect-backend.onrender.com/api');
      
      // Use FormData for multipart/form-data when uploading files
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('name', name);
      formData.append('role', role);
      
      // Add ID card file if provided (required for students)
      if (idCard) {
        console.log('📎 Appending ID card to form data:', idCard.name, idCard.type, idCard.size);
        formData.append('idCard', idCard);
      }
      
      // Log form data (for debugging)
      console.log('📋 Form data entries:');
      for (const pair of (formData as any).entries()) {
        console.log(pair[0], pair[0] === 'idCard' ? 'File object present' : pair[1]);
      }
      
      const response = await authAPI.signup(formData);
      console.log('✅ Signup response received:', response.status);
      console.log('📝 Signup response data:', response.data);
      
      const { token, user: userData } = response.data;
      
      const user: User = {
        id: userData.id || userData._id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        verificationStatus: userData.verificationStatus,
        idCardUrl: userData.idCardUrl
      };

      // For prototype, all users get immediate access
      setAuthData(token, user);
      setUser(user);
      console.log('🎉 Signup successful');
      
      // No need to check verification status for prototype
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      console.error('📊 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      const message = error.response?.data?.message || error.message || 'Signup failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthData();
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};