import type { ApiError } from "../api/client";

export interface ErrorHandler {
  handleError: (error: unknown, context?: string) => void;
}

export const createErrorHandler = (toastAdd: (type: 'error' | 'warning' | 'info', message: string) => void): ErrorHandler => ({
  handleError: (error: unknown, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);

    if (error instanceof Error) {
      const apiError = error as ApiError;

      // Handle different error types
      if (apiError.status) {
        switch (apiError.status) {
          case 400:
            toastAdd('error', 'Invalid request. Please check your input.');
            break;
          case 401:
            toastAdd('error', 'Authentication required. Please log in again.');
            break;
          case 403:
            toastAdd('error', 'You do not have permission to perform this action.');
            break;
          case 404:
            toastAdd('error', 'The requested resource was not found.');
            break;
          case 409:
            toastAdd('error', 'This action conflicts with existing data.');
            break;
          case 422:
            toastAdd('error', 'Validation failed. Please check your input.');
            break;
          case 429:
            toastAdd('warning', 'Too many requests. Please wait a moment and try again.');
            break;
          case 500:
            toastAdd('error', 'Server error. Please try again later.');
            break;
          case 503:
            toastAdd('warning', 'Service temporarily unavailable. Please try again later.');
            break;
          default:
            toastAdd('error', apiError.message || 'An unexpected error occurred.');
        }
      } else {
        // Network or other errors
        if (error.message.includes('fetch')) {
          toastAdd('error', 'Network error. Please check your connection and try again.');
        } else {
          toastAdd('error', error.message || 'An unexpected error occurred.');
        }
      }
    } else {
      // Unknown error type
      toastAdd('error', 'An unexpected error occurred.');
    }
  },
});