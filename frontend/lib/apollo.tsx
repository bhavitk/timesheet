import React from "react";
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloProvider,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "/graphql",
});

const authLink = setContext((_, { headers }) => {
  // read the token from localStorage
  let token = "";
  try {
    token =
      typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";
  } catch (e) {
    // noop
  }
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
});

export function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
}

export const ApolloAppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const client = React.useMemo(() => createApolloClient(), []);
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
