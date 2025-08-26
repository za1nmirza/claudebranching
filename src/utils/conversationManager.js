/**
 * ConversationManager with secure ID generation and proper validation
 */
import { 
  generateConversationId, 
  generateBranchId, 
  generateMessageId,
  validateId 
} from './idGenerator.js';
import { 
  validateMessage, 
  validateBranchTitle, 
  validateConversationData,
  ValidationError 
} from './validation.js';
import { 
  logError, 
  safeAsync 
} from './errorHandling.js';

export class ConversationManager {
  constructor() {
    this.conversations = new Map();
    this.currentConversationId = null;
    this.currentBranch = null;
  }

  /**
   * Creates a new conversation with validation
   */
  createConversation(title = "New Conversation") {
    try {
      const sanitizedTitle = validateBranchTitle(title);
      const id = generateConversationId();
      
      const conversation = {
        id,
        title: sanitizedTitle,
        createdAt: new Date(),
        branches: new Map(),
        currentBranch: 'main',
        breadcrumbs: ['Main Channel'],
        condensedItems: [],
        lastSummarizedMessageId: null,
        condensedLastUpdated: null
      };

      // Create main branch
      const mainBranch = this._createBranch('main', 'Main Channel');
      conversation.branches.set('main', mainBranch);

      this.conversations.set(id, conversation);
      this.currentConversationId = id;
      this.currentBranch = 'main';
      
      this._saveToStorage();
      return conversation;
      
    } catch (error) {
      logError(error, { operation: 'createConversation', title });
      throw new ValidationError('Failed to create conversation');
    }
  }

  /**
   * Creates a branch with validation (private method)
   */
  _createBranch(id, title, parentBranchId = null, parentMessageId = null) {
    try {
      const sanitizedTitle = validateBranchTitle(title);
      
      return {
        id,
        title: sanitizedTitle,
        parentBranchId,
        parentMessageId,
        messages: [],
        branches: new Map(),
        createdAt: new Date(),
        isActive: true
      };
      
    } catch (error) {
      logError(error, { operation: '_createBranch', id, title });
      throw new ValidationError('Failed to create branch');
    }
  }

  /**
   * Adds a message with validation and security checks
   */
  addMessage(content, sender = 'user', branchId = null) {
    try {
      const sanitizedContent = validateMessage(content);
      
      if (!['user', 'assistant'].includes(sender)) {
        throw new ValidationError('Invalid sender type');
      }

      const conversation = this.getCurrentConversation();
      if (!conversation) {
        throw new ValidationError('No active conversation');
      }

      const targetBranch = branchId || this.currentBranch;
      const branch = conversation.branches.get(targetBranch);
      if (!branch) {
        throw new ValidationError('Branch not found');
      }

      const message = {
        id: generateMessageId(),
        content: sanitizedContent,
        sender,
        timestamp: new Date(),
        branchPoint: sender === 'assistant',
        availableBranches: [],
        starred: false
      };

      branch.messages.push(message);
      this._saveToStorage();
      return message;
      
    } catch (error) {
      logError(error, { operation: 'addMessage', sender, branchId });
      throw error;
    }
  }

  /**
   * Creates a branch from a specific message with validation
   */
  createBranchFromMessage(messageId, branchTitle) {
    try {
      if (!validateId(messageId, 'message')) {
        throw new ValidationError('Invalid message ID format');
      }
      
      const sanitizedTitle = validateBranchTitle(branchTitle);
      const conversation = this.getCurrentConversation();
      
      if (!conversation) {
        throw new ValidationError('No active conversation');
      }

      const currentBranch = conversation.branches.get(this.currentBranch);
      if (!currentBranch) {
        throw new ValidationError('Current branch not found');
      }

      const branchId = generateBranchId();
      const newBranch = this._createBranch(
        branchId, 
        sanitizedTitle, 
        this.currentBranch, 
        messageId
      );

      // Copy context up to the branching point
      const messageIndex = currentBranch.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) {
        throw new ValidationError('Message not found in current branch');
      }
      
      // Deep copy messages to avoid reference issues
      newBranch.messages = currentBranch.messages
        .slice(0, messageIndex + 1)
        .map(msg => ({ ...msg, availableBranches: [...msg.availableBranches] }));

      currentBranch.branches.set(branchId, newBranch);
      conversation.branches.set(branchId, newBranch);

      // Update breadcrumbs
      this.switchToBranch(branchId);
      this._saveToStorage();
      
      return newBranch;
      
    } catch (error) {
      logError(error, { operation: 'createBranchFromMessage', messageId, branchTitle });
      throw error;
    }
  }

  switchToBranch(branchId) {
    console.log('🔀 Switching to branch:', branchId);
    
    const conversation = this.getCurrentConversation();
    if (!conversation || !conversation.branches.has(branchId)) {
      console.log('❌ Cannot switch - branch not found:', branchId);
      return false;
    }

    console.log('📍 Previous branch:', this.currentBranch);
    this.currentBranch = branchId;
    conversation.currentBranch = branchId;
    console.log('📍 New current branch:', this.currentBranch);

    // Update breadcrumbs
    conversation.breadcrumbs = this.generateBreadcrumbs(branchId);
    console.log('🍞 Updated breadcrumbs:', conversation.breadcrumbs);
    
    this._saveToStorage();
    
    return true;
  }

  generateBreadcrumbs(branchId) {
    const conversation = this.getCurrentConversation();
    if (!conversation) return [];

    const branch = conversation.branches.get(branchId);
    if (!branch) return [];

    const breadcrumbs = [branch.title];
    
    let currentBranch = branch;
    while (currentBranch.parentBranchId) {
      const parentBranch = conversation.branches.get(currentBranch.parentBranchId);
      if (!parentBranch) break;
      breadcrumbs.unshift(parentBranch.title);
      currentBranch = parentBranch;
    }

    return breadcrumbs;
  }

  closeBranch(branchId) {
    const conversation = this.getCurrentConversation();
    if (!conversation || branchId === 'main') return false;

    const branch = conversation.branches.get(branchId);
    if (!branch) return false;

    branch.isActive = false;
    
    // If we're closing the current branch, switch to parent
    if (this.currentBranch === branchId) {
      this.switchToBranch(branch.parentBranchId || 'main');
    }

    this._saveToStorage();
    return true;
  }

  getCurrentConversation() {
    return this.currentConversationId ? this.conversations.get(this.currentConversationId) : null;
  }

  getCurrentBranch() {
    const conversation = this.getCurrentConversation();
    return conversation ? conversation.branches.get(this.currentBranch) : null;
  }

  getAllActiveBranches() {
    const conversation = this.getCurrentConversation();
    if (!conversation) return [];

    return Array.from(conversation.branches.values()).filter(branch => branch.isActive);
  }

  getConversationTree() {
    const conversation = this.getCurrentConversation();
    if (!conversation) return null;

    const buildTree = (branchId) => {
      const branch = conversation.branches.get(branchId);
      if (!branch || !branch.isActive) return null;

      return {
        id: branch.id,
        title: branch.title,
        isActive: this.currentBranch === branchId,
        children: Array.from(branch.branches.keys()).map(buildTree).filter(Boolean)
      };
    };

    return buildTree('main');
  }

  /**
   * Saves conversation data to localStorage with error handling
   */
  _saveToStorage() {
    return safeAsync(async () => {
      const data = {
        conversations: Array.from(this.conversations.entries()),
        currentConversationId: this.currentConversationId,
        currentBranch: this.currentBranch,
        version: '1.0', // For future migration support
        timestamp: new Date().toISOString()
      };
      
      const serialized = JSON.stringify(data, (_, value) => {
        if (value instanceof Map) {
          return Array.from(value.entries());
        }
        return value;
      });
      
      localStorage.setItem('claudeBranchingData', serialized);
      return true;
      
    }, false);
  }

  /**
   * Loads conversation data from localStorage with validation
   */
  loadFromStorage() {
    return safeAsync(() => {
      const data = localStorage.getItem('claudeBranchingData');
      if (!data) return false;

      const parsed = JSON.parse(data, (key, value) => {
        if (key === 'conversations' || key === 'branches') {
          return new Map(value);
        }
        return value;
      });

      // Validate loaded data structure
      if (!parsed.conversations || !parsed.currentConversationId) {
        throw new Error('Invalid stored data structure');
      }

      this.conversations = parsed.conversations;
      this.currentConversationId = parsed.currentConversationId;
      this.currentBranch = parsed.currentBranch || 'main';
      
      // Add backward compatibility for existing messages without starred property
      // and conversations without condensed items
      for (const [, conversation] of this.conversations) {
        // Add condensed items support to existing conversations
        if (conversation.condensedItems === undefined) {
          conversation.condensedItems = [];
          conversation.lastSummarizedMessageId = null;
          conversation.condensedLastUpdated = null;
        }
        
        for (const [, branch] of conversation.branches) {
          branch.messages.forEach(message => {
            if (message.starred === undefined) {
              message.starred = false;
            }
          });
        }
      }
      
      // Validate the loaded conversation exists
      const currentConversation = this.getCurrentConversation();
      if (!currentConversation) {
        throw new Error('Current conversation not found in loaded data');
      }
      
      return true;
      
    }, false);
  }

  /**
   * Clears all stored data (useful for testing/reset)
   */
  clearStorage() {
    return safeAsync(() => {
      localStorage.removeItem('claudeBranchingData');
      this.conversations.clear();
      this.currentConversationId = null;
      this.currentBranch = null;
      return true;
    }, false);
  }

  deleteConversation(conversationId) {
    console.log('🔍 Available conversations:', Array.from(this.conversations.keys()));
    console.log('🎯 Trying to delete:', conversationId);
    
    if (!this.conversations.has(conversationId)) {
      console.log('❌ Cannot delete - conversation not found:', conversationId);
      return false;
    }

    console.log('🗑️ Deleting conversation:', conversationId);
    this.conversations.delete(conversationId);
    
    // If we deleted the current conversation, reset to null
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null;
      this.currentBranch = 'main';
    }
    
    this._saveToStorage();
    return true;
  }

  /**
   * Toggles the starred status of a message
   */
  toggleMessageStar(messageId, branchId = null) {
    try {
      if (!validateId(messageId, 'message')) {
        throw new ValidationError('Invalid message ID format');
      }

      const conversation = this.getCurrentConversation();
      if (!conversation) {
        throw new ValidationError('No active conversation');
      }

      const targetBranch = branchId || this.currentBranch;
      const branch = conversation.branches.get(targetBranch);
      if (!branch) {
        throw new ValidationError('Branch not found');
      }

      const message = branch.messages.find(msg => msg.id === messageId);
      if (!message) {
        throw new ValidationError('Message not found');
      }

      // Toggle starred status
      message.starred = !message.starred;
      this._saveToStorage();
      
      return message.starred;
      
    } catch (error) {
      logError(error, { operation: 'toggleMessageStar', messageId, branchId });
      throw error;
    }
  }

  /**
   * Gets all starred messages across all conversations
   */
  getStarredMessages() {
    try {
      const starredMessages = [];
      
      for (const [conversationId, conversation] of this.conversations) {
        for (const [branchId, branch] of conversation.branches) {
          const starredInBranch = branch.messages
            .filter(msg => msg.starred)
            .map(msg => ({
              ...msg,
              conversationId,
              conversationTitle: conversation.title,
              branchId,
              branchTitle: branch.title
            }));
          starredMessages.push(...starredInBranch);
        }
      }
      
      // Sort by timestamp, newest first
      return starredMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
    } catch (error) {
      logError(error, { operation: 'getStarredMessages' });
      return [];
    }
  }

  /**
   * Gets messages from current conversation for condensing
   * Handles branched conversations by collecting messages chronologically
   */
  getMessagesForCondensing() {
    try {
      const conversation = this.getCurrentConversation();
      if (!conversation) {
        return [];
      }

      // Collect all messages from all branches with metadata
      const allMessages = [];
      
      for (const [branchId, branch] of conversation.branches) {
        branch.messages.forEach(message => {
          allMessages.push({
            ...message,
            branchId,
            branchTitle: branch.title
          });
        });
      }

      // Sort by timestamp to maintain chronological order
      return allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
    } catch (error) {
      logError(error, { operation: 'getMessagesForCondensing' });
      return [];
    }
  }

  /**
   * Gets existing condensed log or generates new one if needed
   */
  async getCondensedLog(forceRefresh = false) {
    try {
      const conversation = this.getCurrentConversation();
      if (!conversation) {
        return [];
      }

      const messages = this.getMessagesForCondensing();
      
      if (messages.length === 0) {
        return [];
      }

      // Check if we need to regenerate
      const needsRegeneration = forceRefresh || 
        !conversation.condensedItems || 
        conversation.condensedItems.length === 0 ||
        this._hasNewMessagesSinceLastSummary(messages, conversation.lastSummarizedMessageId);

      if (!needsRegeneration) {
        // Return existing condensed items
        return {
          items: conversation.condensedItems || [],
          parseError: conversation.condensedParseError || false,
          errorMessage: conversation.condensedErrorMessage || null
        };
      }

      // Generate new condensed log
      const result = await this._generateCondensedLogFromAPI(messages);
      
      // Store in conversation
      conversation.condensedItems = result.items;
      conversation.condensedParseError = result.parseError;
      conversation.condensedErrorMessage = result.errorMessage;
      conversation.lastSummarizedMessageId = messages[messages.length - 1]?.id || null;
      conversation.condensedLastUpdated = new Date().toISOString();
      
      // Save to storage
      this._saveToStorage();
      
      return result;
      
    } catch (error) {
      logError(error, { operation: 'getCondensedLog' });
      return {
        items: [],
        parseError: true,
        errorMessage: 'Failed to load condensed log'
      };
    }
  }

  /**
   * Private method to generate condensed log from API
   */
  async _generateCondensedLogFromAPI(messages) {
    try {
      const response = await fetch('http://localhost:3001/api/condense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages })
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          items: data.condensed || [],
          parseError: data.parseError || false,
          errorMessage: data.errorMessage || null
        };
      } else {
        throw new Error(data.error || 'Failed to generate condensed log');
      }
      
    } catch (error) {
      logError(error, { operation: '_generateCondensedLogFromAPI' });
      return {
        items: [],
        parseError: true,
        errorMessage: 'Network error: Unable to connect to server'
      };
    }
  }

  /**
   * Check if there are new messages since last summary
   */
  _hasNewMessagesSinceLastSummary(messages, lastSummarizedMessageId) {
    if (!lastSummarizedMessageId || messages.length === 0) {
      return true; // No previous summary or no messages
    }

    // Find the index of the last summarized message
    const lastSummarizedIndex = messages.findIndex(msg => msg.id === lastSummarizedMessageId);
    
    // If we can't find the last summarized message or there are messages after it
    return lastSummarizedIndex === -1 || lastSummarizedIndex < messages.length - 1;
  }

  /**
   * Force refresh of condensed log
   */
  async refreshCondensedLog() {
    return await this.getCondensedLog(true);
  }

  /**
   * @deprecated Use getCondensedLog() instead
   */
  async generateCondensedLog() {
    return await this.getCondensedLog();
  }

  /**
   * Finds a message by ID across all branches in current conversation
   */
  findMessageById(messageId) {
    try {
      const conversation = this.getCurrentConversation();
      if (!conversation) {
        return null;
      }

      for (const [branchId, branch] of conversation.branches) {
        const message = branch.messages.find(msg => msg.id === messageId);
        if (message) {
          return {
            message,
            branchId,
            branchTitle: branch.title
          };
        }
      }

      return null;
      
    } catch (error) {
      logError(error, { operation: 'findMessageById', messageId });
      return null;
    }
  }

  /**
   * Switches to the branch containing a specific message
   */
  switchToBranchContainingMessage(messageId) {
    try {
      const result = this.findMessageById(messageId);
      if (result) {
        this.switchToBranch(result.branchId);
        return true;
      }
      return false;
      
    } catch (error) {
      logError(error, { operation: 'switchToBranchContainingMessage', messageId });
      return false;
    }
  }
}

export default ConversationManager;