"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  set_up: boolean;
  is_setup: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const checkAuth = async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setUser(null);
      setToken(null);
      return;
    }

    // Verify token with backend (optional - you can add an endpoint for this)
    // For now, just check if token exists in localStorage
    try {
      // You can add a /api/me endpoint to verify token
      // const response = await fetch("/api/me", {
      //   headers: { Authorization: `Bearer ${storedToken}` }
      // });
      // if (!response.ok) throw new Error("Invalid token");
    } catch (err) {
      logout();
    }
  };

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // If username is missing, clear auth (user needs to log in again)
        if (!userData.username) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          return;
        }
        setToken(storedToken);
        setUser(userData);
        // Optionally verify token is still valid
        checkAuth();
      } catch (err) {
        // Invalid stored data, clear it
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

