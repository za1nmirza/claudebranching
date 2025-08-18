/**
 * Claude API Service with proper error handling, validation, and security
 */
import { config } from '../config/index.js';
import { API_CONFIG, ERROR_MESSAGES } from '../constants/api.js';
import { TIMING } from '../constants/timing.js';
import { 
  validateMessage, 
  validateSelectedText, 
  messageRateLimiter 
} from './validation.js';
import { 
  ApiError, 
  NetworkError, 
  TimeoutError,
  withRetry, 
  withTimeout, 
  logError,
  formatErrorForUser
} from './errorHandling.js';

export class ClaudeApiService {
  constructor() {
    this.backendUrl = config.api.backendUrl;
    this.timeout = config.api.timeout;
    this.retries = config.api.retries;
  }

  /**
   * Sends message to Claude API with validation and error handling
   */
  async sendMessage(messages, maxTokens = config.claude.maxTokens) {
    this._validateMessages(messages);
    this._checkRateLimit();
    
    const operation = () => this._performSendMessage(messages, maxTokens);
    
    try {
      return await withRetry(operation, this.retries, TIMING.RETRY_DELAY);
    } catch (error) {
      logError(error, { operation: 'sendMessage', messageCount: messages.length });
      throw new ApiError(formatErrorForUser(error));
    }
  }

  /**
   * Internal method to perform the actual API call
   */
  async _performSendMessage(messages, maxTokens) {
    const formattedMessages = this._formatMessages(messages);
    
    const requestPromise = fetch(`${this.backendUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        messages: formattedMessages,
        maxTokens: maxTokens
      })
    });

    const response = await withTimeout(requestPromise, this.timeout);
    
    return await this._handleResponse(response);
  }

  /**
   * Handles API response with proper error checking
   */
  async _handleResponse(response) {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText };
      }
      
      throw new ApiError(
        `API Error: ${response.status} - ${errorData.error || response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new ApiError(data.error || 'Unknown API error');
    }
    
    if (!data.response || typeof data.response !== 'string') {
      throw new ApiError('Invalid response format from API');
    }
    
    return data.response;
  }

  /**
   * Validates message array
   */
  _validateMessages(messages) {
    if (!Array.isArray(messages)) {
      throw new ApiError('Messages must be an array');
    }
    
    if (messages.length === 0) {
      throw new ApiError('At least one message is required');
    }
    
    messages.forEach((msg, index) => {
      if (!msg || typeof msg !== 'object') {
        throw new ApiError(`Invalid message at index ${index}`);
      }
      
      if (!msg.content || typeof msg.content !== 'string') {
        throw new ApiError(`Message content is required at index ${index}`);
      }
      
      if (!['user', 'assistant'].includes(msg.sender)) {
        throw new ApiError(`Invalid sender "${msg.sender}" at index ${index}`);
      }
      
      validateMessage(msg.content);
    });
  }

  /**
   * Checks rate limiting
   */
  _checkRateLimit() {
    if (!messageRateLimiter.isAllowed()) {
      throw new ApiError('Rate limit exceeded. Please wait before sending another message.');
    }
  }

  /**
   * Formats messages for API consumption
   */
  _formatMessages(messages) {
    return messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content.trim()
    }));
  }

  /**
   * Generates branch name with proper validation and error handling
   */
  async generateBranchName(lastUserMessage, lastAssistantMessage) {
    try {
      // Validate inputs
      if (lastUserMessage) {
        validateMessage(lastUserMessage);
      }
      if (lastAssistantMessage) {
        validateMessage(lastAssistantMessage);
      }
      
      const operation = () => this._performBranchNameGeneration(lastUserMessage, lastAssistantMessage);
      return await withRetry(operation, this.retries, TIMING.RETRY_DELAY);
      
    } catch (error) {
      logError(error, { operation: 'generateBranchName' });
      return this._getDefaultBranchName();
    }
  }

  /**
   * Internal method to perform branch name generation
   */
  async _performBranchNameGeneration(lastUserMessage, lastAssistantMessage) {
    const requestPromise = fetch(`${this.backendUrl}/generate-branch-name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        lastUserMessage: lastUserMessage || '',
        lastAssistantMessage: lastAssistantMessage || ''
      })
    });

    const response = await withTimeout(requestPromise, this.timeout);
    const data = await this._handleResponse(response);
    
    // Validate the branch name
    if (data.branchName && typeof data.branchName === 'string') {
      const trimmed = data.branchName.trim();
      if (trimmed.length > 0 && trimmed.length <= API_CONFIG.BRANCH_NAME_MAX_LENGTH) {
        return trimmed;
      }
    }
    
    return this._getDefaultBranchName();
  }

  /**
   * Returns a default branch name
   */
  _getDefaultBranchName() {
    const defaultNames = [
      'Discussion Branch',
      'Topic Exploration', 
      'Deep Dive',
      'Follow-up',
      'Alternative View',
      'Detailed Analysis'
    ];
    
    const randomIndex = Math.floor(Math.random() * defaultNames.length);
    return defaultNames[randomIndex];
  }

  /**
   * Creates a branch with selected text
   */
  async generateBranchNameForText(selectedText) {
    try {
      validateSelectedText(selectedText);
      
      const contextMessage = `About: "${selectedText}"`;
      return await this.generateBranchName(contextMessage, '');
      
    } catch (error) {
      logError(error, { operation: 'generateBranchNameForText', selectedText });
      return `About: ${selectedText.slice(0, 20)}...`;
    }
  }

  /**
   * Simulated streaming for better UX (placeholder for future real streaming)
   */
  async streamMessage(messages, onToken, onComplete, onError) {
    try {
      this._validateStreamingCallbacks(onToken, onComplete, onError);
      
      const response = await this.sendMessage(messages);
      
      this._simulateStreaming(response, onToken, onComplete);
      
    } catch (error) {
      logError(error, { operation: 'streamMessage' });
      onError(formatErrorForUser(error));
    }
  }

  /**
   * Validates streaming callback functions
   */
  _validateStreamingCallbacks(onToken, onComplete, onError) {
    if (typeof onToken !== 'function') {
      throw new ApiError('onToken callback must be a function');
    }
    if (typeof onComplete !== 'function') {
      throw new ApiError('onComplete callback must be a function');
    }
    if (typeof onError !== 'function') {
      throw new ApiError('onError callback must be a function');
    }
  }

  /**
   * Simulates streaming response
   */
  _simulateStreaming(response, onToken, onComplete) {
    const CHUNK_SIZE = 3;
    const STREAM_DELAY = 30;
    
    let currentIndex = 0;
    
    const streamInterval = setInterval(() => {
      if (currentIndex < response.length) {
        const chunk = response.slice(currentIndex, currentIndex + CHUNK_SIZE);
        onToken(chunk);
        currentIndex += CHUNK_SIZE;
      } else {
        clearInterval(streamInterval);
        onComplete(response);
      }
    }, STREAM_DELAY);
  }
}

export default ClaudeApiService;