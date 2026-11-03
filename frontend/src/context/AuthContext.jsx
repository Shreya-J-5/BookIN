import React, { createContext, useContext, useState, useEffect } from 'react';
import { graphqlRequest } from '../services/graphqlClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bookin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('bookin_access_token') || null);
  const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem('bookin_city') || 'Mumbai');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  useEffect(() => {
    if (user) {
      localStorage.setItem('bookin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bookin_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('bookin_access_token', token);
    } else {
      localStorage.removeItem('bookin_access_token');
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('bookin_city', selectedCity);
  }, [selectedCity]);

  const login = async (email, password) => {
    const mutation = `
      mutation LoginUser($input: LoginInput!) {
        login(input: $input) {
          user {
            id
            email
            fullName
            phone
            city
            roles
          }
          accessToken
          refreshToken
        }
      }
    `;
    const data = await graphqlRequest(mutation, { input: { email, password } });
    const { user: loggedUser, accessToken, refreshToken } = data.login;
    setUser(loggedUser);
    setToken(accessToken);
    localStorage.setItem('bookin_refresh_token', refreshToken);
    setIsAuthModalOpen(false);
    return loggedUser;
  };

  const register = async ({ email, password, fullName, phone, city, role }) => {
    const mutation = `
      mutation RegisterUser($input: RegisterInput!) {
        register(input: $input) {
          user {
            id
            email
            fullName
            phone
            city
            roles
          }
          accessToken
          refreshToken
        }
      }
    `;
    const data = await graphqlRequest(mutation, {
      input: { email, password, fullName, phone, city: city || selectedCity, role: role || 'CUSTOMER' }
    });
    const { user: registeredUser, accessToken, refreshToken } = data.register;
    setUser(registeredUser);
    setToken(accessToken);
    localStorage.setItem('bookin_refresh_token', refreshToken);
    setIsAuthModalOpen(false);
    return registeredUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bookin_user');
    localStorage.removeItem('bookin_access_token');
    localStorage.removeItem('bookin_refresh_token');
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const isAdmin = user?.roles?.some(r => r === 'ADMIN' || r === 'SUPER_ADMIN') || false;
  const isTheatreAdmin = user?.roles?.some(r => r === 'THEATRE_ADMIN' || r === 'ADMIN' || r === 'SUPER_ADMIN') || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin,
        isTheatreAdmin,
        selectedCity,
        setSelectedCity,
        login,
        register,
        logout,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
