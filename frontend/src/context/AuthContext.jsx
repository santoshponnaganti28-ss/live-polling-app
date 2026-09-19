import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getMe()
        .then((res) => setUser(res.user))
        .catch(() => {
          setAuthToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    setAuthToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (username, email, password) => {
    const res = await api.register({ username, email, password });
    setAuthToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
