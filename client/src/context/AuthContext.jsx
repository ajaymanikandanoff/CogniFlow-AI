import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [demoActive, setDemoActive] = useState(false);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          setProfile(res.profile);
          if (res.user.email === 'alex.student@hackathon.edu') {
            setDemoActive(true);
          }
        } catch (e) {
          console.warn('Session expired or invalid, logging out.');
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('token', res.token);
    setToken(res.token);
    setUser(res.user);
    setProfile(res.profile);
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    localStorage.setItem('token', res.token);
    setToken(res.token);
    setUser(res.user);
    setProfile(res.profile);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setDemoActive(false);
  };

  const loadDemoAlex = async () => {
    setLoading(true);
    try {
      const res = await api.loadDemo();
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
      setDemoActive(true);
      return res;
    } catch (e) {
      console.error('Failed to load demo:', e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      token,
      loading,
      demoActive,
      login,
      register,
      logout,
      loadDemoAlex
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
