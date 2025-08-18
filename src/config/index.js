/**
 * Centralized configuration management
 */
import { API_CONFIG } from '../constants/api.js';
import { TIMING } from '../constants/timing.js';

// Environment-based configuration
export const config = {
  // API Configuration
  api: {
    backendUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001/api',
    timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || TIMING.DEFAULT_API_TIMEOUT,
    retries: parseInt(process.env.REACT_APP_API_RETRIES) || TIMING.MAX_RETRY_ATTEMPTS,
    useHttps: process.env.NODE_ENV === 'production'
  },
  
  // Claude API Configuration
  claude: {
    model: process.env.REACT_APP_CLAUDE_MODEL || API_CONFIG.DEFAULT_CLAUDE_MODEL,
    maxTokens: parseInt(process.env.REACT_APP_CLAUDE_MAX_TOKENS) || API_CONFIG.DEFAULT_MAX_TOKENS,
    branchNameMaxTokens: API_CONFIG.BRANCH_NAME_MAX_TOKENS
  },
  
  // UI Configuration
  ui: {
    debounceTime: TIMING.DEBOUNCE_TIME,
    scrollDelay: TIMING.SCROLL_DELAY,
    syncInterval: TIMING.SYNC_INTERVAL,
    updateDelay: TIMING.UI_UPDATE_DELAY
  },
  
  // Validation Configuration
  validation: {
    maxMessageLength: API_CONFIG.MAX_MESSAGE_LENGTH,
    minMessageLength: API_CONFIG.MIN_MESSAGE_LENGTH,
    maxBranchNameLength: API_CONFIG.BRANCH_NAME_MAX_LENGTH
  },
  
  // Feature Flags
  features: {
    textSelectionBranching: true,
    autoSync: true,
    streamingResponses: false,
    analytics: process.env.NODE_ENV === 'production'
  }
};

/**
 * Validates configuration on startup
 */
export function validateConfig() {
  const errors = [];
  
  if (!config.api.backendUrl) {
    errors.push('Backend URL is required');
  }
  
  if (config.api.timeout < 1000) {
    errors.push('API timeout must be at least 1000ms');
  }
  
  if (config.validation.maxMessageLength < 1) {
    errors.push('Max message length must be positive');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }
  
  return true;
}

// Validate configuration on import
validateConfig();