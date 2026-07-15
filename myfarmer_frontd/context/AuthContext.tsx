"use client";

import { createContext, useContext, useEffect, useReducer } from "react";
import type { ReactNode } from "react";
import { apiPost } from "@/lib/apiClient";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, clearAuthToken, setAuthToken } from "@/lib/auth";

type User = {
  id: number;
  nama_lengkap: string;
  email: string;
  nama_role: string;
  is_active: boolean;
  last_login?: string | null;
};

type LoginCredentials = {
  email: string;
  password: string;
};

type LoginData = {
  user: User;
  token: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isReady: boolean;
};

type AuthContextValue = AuthState & {
  nama_role: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

type AuthAction =
  | { type: "hydrate"; token: string | null; user: User | null }
  | { type: "login"; token: string; user: User }
  | { type: "logout" };

const AuthContext = createContext<AuthContextValue | null>(null);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "hydrate":
      return { token: action.token, user: action.user, isReady: true };
    case "login":
      return { token: action.token, user: action.user, isReady: true };
    case "logout":
      return { token: null, user: null, isReady: true };
    default:
      return state;
  }
}

function storeSession(token: string, user: User) {
  setAuthToken(token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearSession() {
  clearAuthToken();
  window.localStorage.removeItem(AUTH_USER_KEY);
}

function parseStoredUser(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(value) as User;
  } catch {
    clearSession();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    isReady: false,
  });

  useEffect(() => {
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = parseStoredUser(window.localStorage.getItem(AUTH_USER_KEY));

    if (storedToken && !storedUser) clearSession();

    dispatch({
      type: "hydrate",
      token: storedToken && storedUser ? storedToken : null,
      user: storedToken && storedUser ? storedUser : null,
    });
  }, []);

  async function login(credentials: LoginCredentials) {
    const response = await apiPost<LoginData>("/auth/login", {
      email: credentials.email,
      password: credentials.password,
    });

    storeSession(response.data.token, response.data.user);
    dispatch({ type: "login", token: response.data.token, user: response.data.user });
  }

  async function logout() {
    try {
      if (state.token) await apiPost<null>("/auth/logout");
    } catch {
    } finally {
      clearSession();
      dispatch({ type: "logout" });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        nama_role: state.user?.nama_role ?? null,
        isAuthenticated: Boolean(state.token && state.user),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus dipakai di dalam AuthProvider.");
  return context;
}



