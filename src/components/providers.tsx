"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        enableSystem
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
      >
        {children}
        <ToasterProvider />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function ToasterProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      richColors
      closeButton
      position="top-center"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}
