import type { Metadata } from "next";
import { ErrorBoundary } from "./ErrorBoundary";
import { Navigation } from "./Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Manager & Weather",
  description: "A simple task management app with weather integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <ErrorBoundary>
          <Navigation />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
