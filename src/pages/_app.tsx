import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="kaikus-theme">
      <ErrorBoundary>
        <Component {...pageProps} />
        <Toaster />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
