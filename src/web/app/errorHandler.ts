/**
 * Global error handler for API calls
 * Provides consistent error handling and logging
 */

export interface ApiError {
  message: string;
  status: number;
  originalError?: unknown;
}

/**
 * Fetch wrapper with global error handling
 */
export async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      const error: ApiError = {
        message: errorMessage,
        status: response.status,
      };

      console.error('API Error:', error);
      throw error;
    }

    return await response.json();
  } catch (error) {
    // Log and re-throw
    console.error('API Call Failed:', {
      url,
      error: error instanceof Error ? error.message : String(error),
      originalError: error,
    });

    if (error instanceof Error && 'status' in error) {
      throw error;
    }

    throw {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 500,
      originalError: error,
    } as ApiError;
  }
}

/**
 * Handle API errors in UI
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  return 'An unexpected error occurred';
}
