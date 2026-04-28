import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "react-error-boundary";
import AppContext from "next/app";

function FallbackError({ error }: { error: Error }) {
  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary FallbackComponent={FallbackError}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Component {...pageProps} />
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Disables Automatic Static Optimization to prevent OOM during build
App.getInitialProps = async () => {
  return { pageProps: {} };
};
