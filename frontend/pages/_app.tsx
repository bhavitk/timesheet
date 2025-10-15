import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ApolloAppProvider } from "../lib/apollo";
import { UserProvider } from "../context/UserContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ApolloAppProvider>
      <UserProvider>
        <Component {...pageProps} />
      </UserProvider>
    </ApolloAppProvider>
  );
}
