import React, { createContext, useContext, useEffect, useState } from "react";
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
