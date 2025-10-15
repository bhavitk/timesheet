import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQuery, gql } from "@apollo/client";

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getCurrentUser {
      id
      email
      name
      isAdmin
      projectId
    }
  }
`;

type User = {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  projectId?: string;
} | null;

type ContextShape = {
  user: User;
  loading: boolean;
  error?: any;
  reload: () => void;
};

const UserContext = createContext<ContextShape>({
  user: null,
  loading: false,
  reload: () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data, loading, error, refetch } = useQuery(GET_CURRENT_USER, {
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
  });

  const [user, setUser] = useState<User>(null);
  const intervalRef = useRef<number | null>(null);

  // Helper: check if a JWT token is expired
  const isJwtExpired = (token?: string | null) => {
    if (!token) return false;
    try {
      const jwt = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
      const parts = jwt.split(".");
      if (parts.length < 2) return false;
      const payload = parts[1];
      // Base64 URL -> Base64
      const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
      const json = atob(b64 + pad);
      const obj = JSON.parse(json);
      if (!obj.exp) return false;
      const now = Math.floor(Date.now() / 1000);
      return obj.exp <= now;
    } catch (e) {
      // If token is malformed treat it as expired to be safe
      return true;
    }
  };

  useEffect(() => {
    if (data?.getCurrentUser) {
      setUser(data.getCurrentUser);
      try {
        localStorage.setItem("userEmail", data.getCurrentUser.email || "");
      } catch (e) {
        // noop
      }
    }
  }, [data]);

  // Periodically check token expiry and force logout when expired.
  useEffect(() => {
    // Run an immediate check and then at an interval
    const checkAndLogout = () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.pathname !== "/" && (window.location.href = "/");
          return;
        }
        if (isJwtExpired(token)) {
          try {
            localStorage.clear();
          } catch (e) {
            // noop
          }
          setUser(null);
          // clear interval immediately
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          window.location.href = "/";
          // Optionally redirect to login/home
          if (typeof window !== "undefined") window.location.href = "/";
        }
      } catch (e) {
        // noop
      }
    };

    // Immediate check on mount
    if (typeof window !== "undefined") {
      checkAndLogout();
    }

    // store interval id in a ref so we can clear it from other callbacks
    const intervalId = window.setInterval(checkAndLogout, 2 * 1000); // every 2s
    intervalRef.current = intervalId as unknown as number;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return (
    <UserContext.Provider
      value={{ user, loading, error, reload: () => refetch() }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;
