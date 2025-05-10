import React, { createContext, useState, useEffect, useContext } from 'react';
import jwt_decode from 'jwt-decode';
import api from '../services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'customer' | 'merchant' | 'admin';
  kycStatus: 'pending' | 'verified' | 'rejected';
  twoFactorEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<{ success: boolean, requires2FA?: boolean }>;
  register: (userData: RegisterData) => Promise<{ success: boolean }>;
  logout: () => void;
  verifyTwoFactor: (userId: string, code: string) => Promise<boolean>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  address?: string;
}

interface TokenPayload {
  id: string;
  email: string;
  role: 'customer' | 'merchant' | 'admin';
  exp: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Decode token to check expiration
          const decoded = jwt_decode<TokenPayload>(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            // Token expired, try to refresh
            if (refreshToken) {
              try {
                const response = await api.post('/auth/refresh-token', { refreshToken });
                const { token: newToken, refreshToken: newRefreshToken } = response.data;
                
                setToken(newToken);
                setRefreshToken(newRefreshToken);
                localStorage.setItem('token', newToken);
                localStorage.setItem('refreshToken', newRefreshToken);
                
                // Update user from new token
                const newDecoded = jwt_decode<TokenPayload>(newToken);
                
                // Fetch user details
                const userResponse = await api.get(`/users/${newDecoded.id}`, {
                  headers: { Authorization: `Bearer ${newToken}` }
                });
                
                setUser(userResponse.data.user);
              } catch (error) {
                // Refresh failed, logout
                handleLogout();
              }
            } else {
              // No refresh token, logout
              handleLogout();
            }
          } else {
            // Token valid, fetch user details
            try {
              const response = await api.get(`/users/${decoded.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              setUser(response.data.user);
            } catch (error) {
              console.error('Error fetching user details:', error);
              handleLogout();
            }
          }
        } catch (error) {
          console.error('Error decoding token:', error);
          handleLogout();
        }
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, []);
  
  // Configure API interceptor for token refresh
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        if (!token) return config;
        
        try {
          const decoded = jwt_decode<TokenPayload>(token);
          const currentTime = Date.now() / 1000;
          
          // If token is expired and we have a refresh token
          if (decoded.exp < currentTime && refreshToken) {
            try {
              const response = await api.post('/auth/refresh-token', { refreshToken });
              const { token: newToken, refreshToken: newRefreshToken } = response.data;
              
              setToken(newToken);
              setRefreshToken(newRefreshToken);
              localStorage.setItem('token', newToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              
              // Update the Authorization header
              config.headers.Authorization = `Bearer ${newToken}`;
            } catch (error) {
              // Refresh failed, logout
              handleLogout();
            }
          }
        } catch (error) {
          console.error('Error in request interceptor:', error);
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [token, refreshToken]);
  
  const login = async (email: string, password: string, twoFactorCode?: string) => {
    try {
      const response = await api.post('/auth/login', { email, password, twoFactorCode });
      
      // Check if 2FA is required
      if (response.data.requiresTwoFactor) {
        return { 
          success: true, 
          requires2FA: true,
          userId: response.data.userId
        };
      }
      
      // Regular login success
      const { token: newToken, refreshToken: newRefreshToken, user: userData } = response.data;
      
      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false };
    }
  };
  
  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      const { token: newToken, refreshToken: newRefreshToken, user: newUser } = response.data;
      
      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setUser(newUser);
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false };
    }
  };
  
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };
  
  const logout = async () => {
    if (token) {
      try {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    handleLogout();
  };
  
  const verifyTwoFactor = async (userId: string, code: string) => {
    try {
      const response = await api.post('/auth/verify-2fa-login', { userId, token: code });
      
      const { token: newToken, refreshToken: newRefreshToken, user: userData } = response.data;
      
      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return true;
    } catch (error) {
      console.error('2FA verification error:', error);
      return false;
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        verifyTwoFactor
      }}
    >
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

export default AuthContext; 