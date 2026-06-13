import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api, setAuthToken } from '../utils/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'STAFF' | 'STUDENT';
  rollNumber?: string;
  class?: { id: number; name: string } | null;
  managedClass?: { id: number; name: string } | null;
  departmentId?: number | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'AUTH_INITIALIZED' };

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  initialized: false,
};

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
        initialized: true,
      };
    case 'AUTH_ERROR':
      return { 
        ...state, 
        loading: false, 
        error: action.payload,
        initialized: true,
      };
    case 'AUTH_LOGOUT':
      return { 
        ...initialState, 
        initialized: true 
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'AUTH_INITIALIZED':
      return { ...state, initialized: true };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('🔄 Initializing auth with stored token');
        setAuthToken(token);
        await fetchUser(token);
      } else {
        console.log('🔍 No stored token found');
        dispatch({ type: 'AUTH_INITIALIZED' });
      }
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      dispatch({ type: 'AUTH_INITIALIZED' });
    }
  };

  const fetchUser = async (token: string) => {
    try {
      console.log('👤 Fetching user data...');
      const response = await api.get('/auth/me');
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.data, token },
      });
      console.log('✅ User data fetched successfully');
    } catch (error: any) {
      console.error('❌ Failed to fetch user:', error);
      
      // Clear invalid token
      localStorage.removeItem('token');
      setAuthToken(null);
      
      const errorMessage = error.response?.data?.error || 'Session expired';
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: errorMessage 
      });
    }
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    console.log('🔐 Attempting login...', { email });
    
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      console.log('✅ Login successful', { user: user.name, role: user.role });
      
      localStorage.setItem('token', token);
      setAuthToken(token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      `Server error: ${error.response.status}`;
        
        console.error('Server response:', error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Unable to connect to server. Please check your connection.';
        console.error('No response received:', error.request);
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred';
        console.error('Error message:', error.message);
      }
      
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: errorMessage 
      });
      
      // Re-throw with formatted error for component handling
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('token');
    setAuthToken(null);
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    state,
    login,
    logout,
    clearError,
    user: state.user,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};