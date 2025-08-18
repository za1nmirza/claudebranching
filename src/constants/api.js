/**
 * API-related constants
 */
export const API_CONFIG = {
  // Claude API settings
  DEFAULT_MAX_TOKENS: 1000,
  BRANCH_NAME_MAX_TOKENS: 20,
  BRANCH_NAME_MAX_LENGTH: 50,
  
  // Request limits
  MAX_MESSAGE_LENGTH: 4000,
  MIN_MESSAGE_LENGTH: 1,
  
  // HTTP settings
  REQUEST_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  
  // Models
  DEFAULT_CLAUDE_MODEL: 'claude-3-haiku-20240307'
};

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  API_ERROR: 'Service temporarily unavailable. Please try again later.',
  VALIDATION_ERROR: 'Invalid input provided.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  BRANCH_CREATION_ERROR: 'Failed to create branch. Please try again.',
  MESSAGE_TOO_LONG: `Message must be less than ${API_CONFIG.MAX_MESSAGE_LENGTH} characters.`,
  MESSAGE_TOO_SHORT: 'Message cannot be empty.',
  INVALID_BRANCH_DATA: 'Invalid branch data provided.'
};