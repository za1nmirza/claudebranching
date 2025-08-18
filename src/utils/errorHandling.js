/**
 * Centralized error handling utilities
 */
import { ERROR_MESSAGES, HTTP_STATUS } from '../constants/api.js';

/**
 * Custom application error classes
 */
export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NetworkError extends AppError {
  constructor(message = ERROR_MESSAGES.NETWORK_ERROR) {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }
}

export class ApiError extends AppError {
  constructor(message = ERROR_MESSAGES.API_ERROR, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message, statusCode);
  }
}

export class TimeoutError extends AppError {
  constructor(message = ERROR_MESSAGES.TIMEOUT_ERROR) {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }
}

export class BranchCreationError extends AppError {
  constructor(message = ERROR_MESSAGES.BRANCH_CREATION_ERROR) {
    super(message, HTTP_STATUS.BAD_REQUEST);
  }
}

/**
 * Error boundary helper for React components
 */
export class ErrorBoundary {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  static componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // reportError(error, errorInfo);
    }
  }
}

/**
 * Retry logic for failed operations
 */
export async function withRetry(
  operation,
  maxAttempts = 3,
  delay = 1000,
  backoffMultiplier = 2
) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry for certain types of errors
      if (error.statusCode === HTTP_STATUS.BAD_REQUEST || 
          error.statusCode === HTTP_STATUS.UNAUTHORIZED ||
          error.statusCode === HTTP_STATUS.FORBIDDEN) {
        throw error;
      }
      
      if (attempt === maxAttempts) {
        break;
      }
      
      const waitTime = delay * Math.pow(backoffMultiplier, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}

/**
 * Timeout wrapper for promises
 */
export function withTimeout(promise, timeoutMs, errorMessage = ERROR_MESSAGES.TIMEOUT_ERROR) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new TimeoutError(errorMessage)), timeoutMs)
    )
  ]);
}

/**
 * Safe async operation wrapper
 */
export async function safeAsync(operation, fallbackValue = null) {
  try {
    return await operation();
  } catch (error) {
    console.error('Safe async operation failed:', error);
    return fallbackValue;
  }
}

/**
 * Error logger with context
 */
export function logError(error, context = {}) {
  const errorInfo = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  console.error('Application Error:', errorInfo);
  
  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Send to external error reporting service
    // Example: Sentry, LogRocket, etc.
  }
  
  return errorInfo;
}

/**
 * User-friendly error message formatter
 */
export function formatErrorForUser(error) {
  if (error.name === 'ValidationError') {
    return error.message;
  }
  
  if (error instanceof NetworkError) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  if (error instanceof TimeoutError) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }
  
  if (error instanceof BranchCreationError) {
    return ERROR_MESSAGES.BRANCH_CREATION_ERROR;
  }
  
  // Generic fallback for unexpected errors
  return ERROR_MESSAGES.API_ERROR;
}

/**
 * Development error handler with detailed information
 */
export function handleDevelopmentError(error, component = 'Unknown') {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error in ${component}`);
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('Component:', component);
    console.groupEnd();
  }
}