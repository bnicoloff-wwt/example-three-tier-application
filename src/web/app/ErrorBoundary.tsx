'use client';

import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component for React
 * Catches render-time errors and displays a fallback UI
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
          <div className="max-w-md w-full bg-red-900 border border-red-700 rounded-lg p-8 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-800 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Something went wrong
            </h1>
            <p className="text-red-100 text-center mb-6">
              An unexpected error occurred. Please try refreshing the page or contacting support.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-800 rounded p-4 mb-4 text-xs text-red-100 font-mono overflow-auto max-h-40">
                <p className="font-bold mb-2">Error Details:</p>
                <p>{this.state.error.message}</p>
                <pre className="mt-2 text-xs whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
