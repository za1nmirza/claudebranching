/**
 * Input validation utilities with security measures
 */
import { API_CONFIG, ERROR_MESSAGES } from '../constants/api.js';

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validates message content
 */
export function validateMessage(content) {
  if (!content || typeof content !== 'string') {
    throw new ValidationError(ERROR_MESSAGES.MESSAGE_TOO_SHORT, 'content');
  }
  
  const sanitized = sanitizeInput(content);
  
  if (sanitized.length < API_CONFIG.MIN_MESSAGE_LENGTH) {
    throw new ValidationError(ERROR_MESSAGES.MESSAGE_TOO_SHORT, 'content');
  }
  
  if (sanitized.length > API_CONFIG.MAX_MESSAGE_LENGTH) {
    throw new ValidationError(ERROR_MESSAGES.MESSAGE_TOO_LONG, 'content');
  }
  
  return sanitized;
}

/**
 * Validates branch title
 */
export function validateBranchTitle(title) {
  if (!title || typeof title !== 'string') {
    throw new ValidationError('Branch title is required', 'title');
  }
  
  const sanitized = sanitizeInput(title);
  
  if (sanitized.length === 0) {
    throw new ValidationError('Branch title cannot be empty', 'title');
  }
  
  if (sanitized.length > API_CONFIG.BRANCH_NAME_MAX_LENGTH) {
    throw new ValidationError(`Branch title must be less than ${API_CONFIG.BRANCH_NAME_MAX_LENGTH} characters`, 'title');
  }
  
  return sanitized;
}

/**
 * Validates message ID format
 */
export function validateMessageId(messageId) {
  if (!messageId || typeof messageId !== 'string') {
    throw new ValidationError('Message ID is required', 'messageId');
  }
  
  // Check for basic ID format (msg_ prefix with timestamp and random string)
  const idPattern = /^msg_\d+_[a-z0-9]+$/;
  if (!idPattern.test(messageId)) {
    throw new ValidationError('Invalid message ID format', 'messageId');
  }
  
  return messageId;
}

/**
 * Validates selected text for branching
 */
export function validateSelectedText(text) {
  if (!text || typeof text !== 'string') {
    throw new ValidationError('Selected text is required', 'selectedText');
  }
  
  const sanitized = sanitizeInput(text);
  
  if (sanitized.length === 0) {
    throw new ValidationError('Selected text cannot be empty', 'selectedText');
  }
  
  if (sanitized.length > 500) { // Reasonable limit for selected text
    throw new ValidationError('Selected text is too long (max 500 characters)', 'selectedText');
  }
  
  return sanitized;
}

/**
 * Validates conversation data structure
 */
export function validateConversationData(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid conversation data', 'conversation');
  }
  
  if (!data.id || typeof data.id !== 'string') {
    throw new ValidationError('Conversation ID is required', 'conversation.id');
  }
  
  if (!data.title || typeof data.title !== 'string') {
    throw new ValidationError('Conversation title is required', 'conversation.title');
  }
  
  if (!data.branches || !(data.branches instanceof Map)) {
    throw new ValidationError('Conversation branches are required', 'conversation.branches');
  }
  
  return true;
}

/**
 * Rate limiting validator (simple client-side check)
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  isAllowed() {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(timestamp => 
      now - timestamp < this.windowMs
    );
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
  
  getRemainingRequests() {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => 
      now - timestamp < this.windowMs
    );
    
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// Global rate limiter instances
export const messageRateLimiter = new RateLimiter(30, 60000); // 30 messages per minute
export const branchRateLimiter = new RateLimiter(10, 60000); // 10 branches per minute