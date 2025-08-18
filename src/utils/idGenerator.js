/**
 * Secure ID generation utilities
 */

/**
 * Generates a cryptographically secure random string
 */
function generateSecureRandomString(length = 9) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto API
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

/**
 * Generates a secure message ID
 */
export function generateMessageId() {
  const timestamp = Date.now();
  const randomPart = generateSecureRandomString(9);
  return `msg_${timestamp}_${randomPart}`;
}

/**
 * Generates a secure conversation ID
 */
export function generateConversationId() {
  const timestamp = Date.now();
  const randomPart = generateSecureRandomString(9);
  return `conv_${timestamp}_${randomPart}`;
}

/**
 * Generates a secure branch ID
 */
export function generateBranchId() {
  const timestamp = Date.now();
  const randomPart = generateSecureRandomString(9);
  return `branch_${timestamp}_${randomPart}`;
}

/**
 * Validates ID format
 */
export function validateId(id, type) {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  const patterns = {
    message: /^msg_\d+_[a-z0-9]{9}$/,
    conversation: /^conv_\d+_[a-z0-9]{9}$/,
    branch: /^branch_\d+_[a-z0-9]{9}$/
  };
  
  const pattern = patterns[type];
  return pattern ? pattern.test(id) : false;
}

/**
 * Extracts timestamp from ID
 */
export function getTimestampFromId(id) {
  const parts = id.split('_');
  if (parts.length >= 2) {
    const timestamp = parseInt(parts[1], 10);
    return isNaN(timestamp) ? null : timestamp;
  }
  return null;
}