import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useHotkeys } from 'react-hotkeys-hook';
import CondensedLog from './CondensedLog';

// Helper function to convert HTML to markdown while preserving formatting
const convertHTMLToMarkdown = (html, fallbackText) => {
  if (!html || html === fallbackText) {
    return fallbackText;
  }
  
  
  // Comprehensive HTML to markdown conversion preserving all formatting
  let markdown = html;
  
  // Convert paragraph tags to double line breaks
  markdown = markdown.replace(/<p[^>]*>/gi, '');
  markdown = markdown.replace(/<\/p>/gi, '\n\n');
  
  // Convert line breaks to markdown line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  
  // Handle the specific pattern where empty <li></li> are followed by <p> tags
  // Clean conversion without bullets for aesthetic formatting
  markdown = markdown.replace(/<ul>\s*<li><\/li>\s*<\/ul>\s*<p>/gi, '\n\n');
  markdown = markdown.replace(/<\/p>\s*<ul>\s*<li><\/li>\s*<\/ul>\s*<p>/gi, '\n\n');
  
  // Handle mixed content selections (paragraphs + lists)
  // First convert strong/em tags to markdown before processing structure
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  
  // Handle cases where selection contains list items
  if (html.includes('<li>')) {
    
    // Extract all list item contents preserving formatting
    const listItemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    const items = [];
    let match;
    while ((match = listItemRegex.exec(html)) !== null) {
      let itemContent = match[1].trim();
      
      // Remove wrapping <p> tags but keep inner formatting that was already converted
      itemContent = itemContent.replace(/^<p[^>]*>/, '').replace(/<\/p>$/, '');
      
      // Remove any remaining HTML tags (formatting was already converted above)
      itemContent = itemContent.replace(/<[^>]*>/g, '');
      
      if (itemContent.trim()) {
        items.push(itemContent.trim());
      }
    }
    
    // Also handle any paragraph content before or after lists
    let nonListContent = markdown.replace(/<ul[\s\S]*?<\/ul>/gi, '');
    nonListContent = nonListContent.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '');
    nonListContent = nonListContent.replace(/<[^>]*>/g, '').trim();
    
    const allItems = [];
    if (nonListContent) {
      allItems.push(nonListContent);
    }
    allItems.push(...items);
    
    if (allItems.length > 0) {
      return allItems.join('\n\n');
    }
  }
  
  // Clean up any remaining empty ul/li tags
  markdown = markdown.replace(/<ul>\s*<li><\/li>\s*<\/ul>/gi, '');
  markdown = markdown.replace(/<\/?li>/gi, '');
  markdown = markdown.replace(/<\/?ul>/gi, '');
  
  // Convert remaining unordered lists (normal case) - remove bullets for clean aesthetic
  markdown = markdown.replace(/<ul[^>]*>/gi, '');
  markdown = markdown.replace(/<\/ul>/gi, '\n\n');
  markdown = markdown.replace(/<li[^>]*>/gi, '');
  markdown = markdown.replace(/<\/li>/gi, '\n\n');
  
  // Convert ordered lists
  let listItemCounter = 1;
  markdown = markdown.replace(/<ol[^>]*>/gi, () => {
    listItemCounter = 1;
    return '';
  });
  markdown = markdown.replace(/<\/ol>/gi, '\n\n');
  markdown = markdown.replace(/<li[^>]*>/gi, () => `${listItemCounter++}. `);
  
  // Convert strong tags to markdown bold
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  
  // Convert em tags to markdown italic
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  
  // Convert heading tags
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
  
  // Convert code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  
  // Convert blockquotes
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n');
  
  // Remove remaining HTML tags but keep their content
  markdown = markdown.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = markdown;
  markdown = tempDiv.textContent || tempDiv.innerText || '';
  
  // Clean up excessive line breaks while preserving intentional paragraph spacing
  markdown = markdown.replace(/\n\n\n+/g, '\n\n'); // Replace 3+ line breaks with 2
  markdown = markdown.replace(/^\n+/, ''); // Remove leading line breaks
  markdown = markdown.replace(/\n+$/, ''); // Remove trailing line breaks
  
  return markdown;
};

const ChatInterface = ({ messages = [], onSendMessage, isLoading = false, conversationManager, onMessagesUpdate, conversationUpdate, setConversationUpdate }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [swipeState, setSwipeState] = useState({});
  const [isMouseDragging, setIsMouseDragging] = useState(false);
  const [starredSearchQuery, setStarredSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [condensedLogOpen, setCondensedLogOpen] = useState(false);
  const [condensedItems, setCondensedItems] = useState([]);
  const [condensedLoading, setCondensedLoading] = useState(false);
  const [condensedParseError, setCondensedParseError] = useState(false);
  const [condensedErrorMessage, setCondensedErrorMessage] = useState(null);

  // Debounce the search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(starredSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [starredSearchQuery]);

  const filterStarredMessages = (messages, query) => {
    if (!query.trim()) return messages;
    
    const searchTerm = query.toLowerCase();
    return messages.filter(message => {
      const content = message.content.toLowerCase();
      const conversationTitle = message.conversationTitle.toLowerCase();
      const branchTitle = message.branchTitle.toLowerCase();
      
      return content.includes(searchTerm) || 
             conversationTitle.includes(searchTerm) || 
             branchTitle.includes(searchTerm);
    });
  };

  const handleSearchInputChange = (e) => {
    setStarredSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setStarredSearchQuery('');
    setDebouncedSearchQuery('');
  };

  // Load condensed log (with smart caching)
  const loadCondensedLog = async (forceRefresh = false) => {
    if (!conversationManager || condensedLoading) return;
    
    setCondensedLoading(true);
    try {
      const result = await conversationManager.getCondensedLog(forceRefresh);
      setCondensedItems(result.items);
      setCondensedParseError(result.parseError);
      setCondensedErrorMessage(result.errorMessage);
    } catch (error) {
      console.error('Failed to load condensed log:', error);
      setCondensedItems([]);
      setCondensedParseError(true);
      setCondensedErrorMessage('Failed to load condensed log');
    } finally {
      setCondensedLoading(false);
    }
  };

  // Handle condensed log toggle
  const handleCondensedLogToggle = async () => {
    if (!condensedLogOpen) {
      // Load existing summaries (or generate if needed)
      await loadCondensedLog(false);
    }
    setCondensedLogOpen(!condensedLogOpen);
  };

  // Handle manual refresh of condensed log
  const handleCondensedLogRefresh = async () => {
    await loadCondensedLog(true);
  };

  // Handle jumping to a message from condensed log
  const handleJumpToMessage = (messageId) => {
    // First, switch to the branch containing the message
    const success = conversationManager.switchToBranchContainingMessage(messageId);
    
    if (success) {
      // Update the current messages
      const currentBranch = conversationManager.getCurrentBranch();
      if (currentBranch) {
        onMessagesUpdate([...currentBranch.messages]);
      }
      
      // Wait a moment for the DOM to update, then scroll to the message
      setTimeout(() => {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
          messageElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Add highlight class
          messageElement.classList.add('message-highlight');
          
          // Remove highlight after animation
          setTimeout(() => {
            messageElement.classList.remove('message-highlight');
          }, 2000);
        }
      }, 100);
    }
  };

  // Keyboard shortcuts
  useHotkeys('meta+j', async (e) => {
    e.preventDefault();
    await handleCondensedLogToggle();
  }, [condensedLogOpen, condensedLoading, conversationManager]);

  // Horizontal swipe detection for trackpads
  useEffect(() => {
    let accumulatedDelta = 0;
    
    const handleWheel = (e) => {
      // Detect strong horizontal swipe (negative deltaX = swipe right)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        accumulatedDelta += -e.deltaX;
        
        // Threshold for opening condensed log
        if (accumulatedDelta > 600 && !condensedLogOpen) {
          handleCondensedLogToggle();
          accumulatedDelta = 0;
        }
      } else {
        accumulatedDelta = 0;
      }
    };

    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.addEventListener('wheel', handleWheel, { passive: true });
      return () => chatContainer.removeEventListener('wheel', handleWheel);
    }
  }, [condensedLogOpen, conversationManager]);

  // Auto-refresh condensed log when messages change (if it's open)
  useEffect(() => {
    if (condensedLogOpen && messages.length > 0) {
      // Refresh condensed log when new messages are added
      const timeoutId = setTimeout(() => {
        loadCondensedLog(false); // Use smart refresh (only if needed)
      }, 1000); // Delay to batch multiple rapid changes
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, condensedLogOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  useEffect(() => {
    let selectionTimeout;
    
    const handleSelectionChange = () => {
      // Clear any existing timeout
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
      
      // Add a delay to debounce selection changes for better performance
      selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();
        const selectedTextContent = selection.toString().trim();
        
        // Only process if we have meaningful text selected (minimum 10 characters to reduce noise)
        if (selectedTextContent && selectedTextContent.length >= 10 && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          // Check if the selection is inside a strong element
          let isInStrongElement = false;
          let currentNode = range.startContainer;
          while (currentNode && currentNode !== document) {
            if (currentNode.nodeType === Node.ELEMENT_NODE && currentNode.tagName === 'STRONG') {
              isInStrongElement = true;
              break;
            }
            currentNode = currentNode.parentNode;
          }
          
          // More robust way to find the assistant message element
          let messageElement = null;
          
          // Start from the range's start container and walk up
          currentNode = range.startContainer;
          while (currentNode && currentNode !== document) {
            if (currentNode.nodeType === Node.ELEMENT_NODE) {
              if (currentNode.classList && currentNode.classList.contains('message') && currentNode.classList.contains('assistant')) {
                messageElement = currentNode;
                break;
              }
              // Also check if this element contains a message with the right classes
              const parentMessage = currentNode.closest('.message.assistant');
              if (parentMessage) {
                messageElement = parentMessage;
                break;
              }
            }
            currentNode = currentNode.parentNode;
          }
          
          if (messageElement) {
            const messageId = messageElement.getAttribute('data-message-id');
            if (messageId) {
              // Get the HTML content of the selection to preserve formatting
              let markdownText = selectedTextContent;
              
              if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const fragment = range.cloneContents();
                
                // Create a temporary div to get the HTML
                const tempDiv = document.createElement('div');
                tempDiv.appendChild(fragment);
                const selectionHTML = tempDiv.innerHTML;
                
                // Convert the HTML to markdown while preserving formatting
                markdownText = convertHTMLToMarkdown(selectionHTML, selectedTextContent);
              }
              
              setSelectedText(markdownText);
              setSelectedMessageId(messageId);
              return;
            }
          }
        }
        
        // Only clear if we don't have a valid selection
        if (!selectedTextContent || selectedTextContent.length < 10) {
          setSelectedText('');
          setSelectedMessageId(null);
        }
      }, 200); // Increased delay to 200ms for better performance
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const handleTextBranch = async () => {
    if (!selectedMessageId || !selectedText) return;
    
    try {
      const message = messages.find(m => m.id === selectedMessageId);
      if (!message) return;

      const messageIndex = messages.findIndex(m => m.id === selectedMessageId);
      const recentMessages = messages.slice(Math.max(0, messageIndex - 1), messageIndex + 1);
      
      let branchTitle = 'New Branch';
      
      try {
        const lastUserMessage = recentMessages.find(m => m.sender === 'user')?.content || '';
        const lastAssistantMessage = message.content;
        
        const response = await fetch('http://localhost:3001/api/generate-branch-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastUserMessage,
            lastAssistantMessage,
            selectedText
          })
        });
        
        const data = await response.json();
        if (data.success && data.branchName) {
          branchTitle = data.branchName;
        }
      } catch (error) {
        console.log('Failed to auto-generate branch name, using default');
      }

      const newBranch = conversationManager.createBranchFromMessage(selectedMessageId, branchTitle);
        
      if (newBranch) {
          // Add only the selected text as an assistant message to start the new branch
          const assistantMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: selectedText,
            sender: 'assistant',
            timestamp: Date.now()
          };
          
          newBranch.messages = [assistantMessage];
          onMessagesUpdate([assistantMessage]);
      }
      
      setSelectedText('');
      setSelectedMessageId(null);
      window.getSelection().removeAllRanges();
    } catch (error) {
      console.error('Error creating branch from selection:', error);
      alert('Failed to create branch: ' + error.message);
    }
  };

  const handleBranch = async (messageId) => {
    try {
      // Find the message to branch from
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      // Find recent context for auto-naming
      const messageIndex = messages.findIndex(m => m.id === messageId);
      const recentMessages = messages.slice(Math.max(0, messageIndex - 1), messageIndex + 1);
      
      // Auto-generate branch name based on message content
      let branchTitle = 'New Branch';
      
      try {
        const lastUserMessage = recentMessages.find(m => m.sender === 'user')?.content || '';
        const lastAssistantMessage = message.content;
        
        const response = await fetch('http://localhost:3001/api/generate-branch-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastUserMessage,
            lastAssistantMessage
          })
        });
        
        const data = await response.json();
        if (data.success && data.branchName) {
          branchTitle = data.branchName;
        }
      } catch (error) {
        console.log('Failed to auto-generate branch name, using default');
      }

      // Create a branch from the current message and switch to it in same window
      const newBranch = conversationManager.createBranchFromMessage(messageId, branchTitle);
        
      if (newBranch) {
          // Add the full assistant message to start the new branch
          const assistantMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: `"${message.content}"`,
            sender: 'assistant',
            timestamp: Date.now()
          };
          
          newBranch.messages = [assistantMessage];
          
          // Switch to the new branch in the same window
          onMessagesUpdate([assistantMessage]);
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Failed to create branch: ' + error.message);
    }
  };;;

  const handleStarToggle = async (messageId) => {
    try {
      const isStarred = conversationManager.toggleMessageStar(messageId);
      
      // Update the UI by refreshing the messages
      const currentBranch = conversationManager.getCurrentBranch();
      if (currentBranch) {
        onMessagesUpdate([...currentBranch.messages]);
      }
      
      console.log(`Message ${messageId} ${isStarred ? 'starred' : 'unstarred'}`);
    } catch (error) {
      console.error('Error toggling star:', error);
      alert('Failed to toggle star: ' + error.message);
    }
  };

  const handleNewMainChat = () => {
    try {
      const newConversation = conversationManager.createConversation('New Chat');
      if (newConversation) {
        onMessagesUpdate([]);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      alert('Failed to create new chat. Please try again.');
    }
  };

  const handleSwitchBranch = (branchId) => {
    try {
      const success = conversationManager.switchToBranch(branchId);
      if (success) {
        onMessagesUpdate(conversationManager.getCurrentBranch().messages);
      }
    } catch (error) {
      console.error('Error switching branch:', error);
    }
  };

  const handleBreadcrumbClick = (index) => {
    if (index === 0 && conversationManager?.currentBranch !== 'main') {
      // Click on "Main Channel" - switch back to main branch
      handleSwitchBranch('main');
    }
  };

  const handleDeleteConversation = (conversationId, e) => {
    e.stopPropagation(); // Prevent clicking on the conversation
    
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        conversationManager.deleteConversation(conversationId);
        
        // Force component re-render and handle navigation
        const remaining = Array.from(conversationManager.conversations.values());
        
        if (conversationManager.currentConversationId === conversationId) {
          // We deleted the current conversation, switch to another one or create new
          if (remaining.length > 0) {
            conversationManager.currentConversationId = remaining[0].id;
            conversationManager.currentBranch = 'main';
            onMessagesUpdate(conversationManager.getCurrentBranch().messages);
          } else {
            // No conversations left, create a new one
            const newConversation = conversationManager.createConversation('New Chat');
            onMessagesUpdate([]);
          }
        }
        
        // Force component re-render to update sidebar immediately
        setConversationUpdate(prev => prev + 1);
      } catch (error) {
        console.error('Error deleting conversation:', error);
        alert('Failed to delete conversation. Please try again.');
      }
    }
  };

  const handleSwipeStart = (branchId, e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    console.log('Swipe start for branch:', branchId, 'at X:', clientX);
    
    // For mouse events, set dragging state
    if (!e.touches) {
      setIsMouseDragging(true);
    }
    
    setSwipeState(prev => ({
      ...prev,
      [branchId]: {
        startX: clientX,
        startY: clientY,
        currentX: clientX,
        isDragging: false,
        deltaX: 0
      }
    }));
  };

  const handleSwipeMove = (branchId, e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const state = swipeState[branchId];
    
    if (!state) return;
    
    // Prevent default only if we're actively dragging
    if (state.isDragging || Math.abs(clientX - state.startX) > 5) {
      e.preventDefault();
    }
    
    const deltaX = clientX - state.startX;
    const deltaY = clientY - state.startY;
    
    console.log('Swipe move for branch:', branchId, 'deltaX:', deltaX, 'deltaY:', deltaY);
    
    // Start dragging if moved more than 5px horizontally
    if (Math.abs(deltaX) > 5) {
      console.log('Setting dragging state for branch:', branchId);
      setSwipeState(prev => ({
        ...prev,
        [branchId]: {
          ...state,
          currentX: clientX,
          isDragging: true,
          deltaX: deltaX
        }
      }));
    }
  };

  const handleSwipeEnd = (branchId, e) => {
    const state = swipeState[branchId];
    
    console.log('Swipe end for branch:', branchId, 'state:', state);
    
    // Reset mouse dragging state
    setIsMouseDragging(false);
    
    if (!state) return;
    
    const deltaX = state.deltaX || 0;
    
    console.log('Final deltaX:', deltaX);
    
    // If swiped right more than 100px, trigger delete
    if (deltaX > 100) {
      console.log('Triggering delete for branch:', branchId);
      handleDeleteBranch(branchId);
    }
    
    // Reset swipe state
    setSwipeState(prev => {
      const newState = { ...prev };
      delete newState[branchId];
      return newState;
    });
  };

  const handleDeleteBranch = (branchId) => {
    if (confirm('Are you sure you want to delete this branch?')) {
      try {
        const conversation = conversationManager.getCurrentConversation();
        if (!conversation) return;
        
        // Don't allow deleting the main branch
        if (branchId === 'main') {
          alert('Cannot delete the main branch');
          return;
        }
        
        // Delete the branch
        conversation.branches.delete(branchId);
        
        // If we're currently on this branch, switch to main
        if (conversationManager.currentBranch === branchId) {
          conversationManager.currentBranch = 'main';
          onMessagesUpdate(conversationManager.getCurrentBranch().messages);
        }
        
        // Save and update UI
        conversationManager._saveToStorage();
        setConversationUpdate(prev => prev + 1);
      } catch (error) {
        console.error('Error deleting branch:', error);
        alert('Failed to delete branch. Please try again.');
      }
    }
  };

  const conversation = conversationManager?.getCurrentConversation();
  const breadcrumbs = conversation?.breadcrumbs || ['Main'];

  return (
    <div className="app">
      <div className="chat-wrapper">
        {/* Sidebar */}
        <div className="sidebar" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
          {/* Header Section */}
          <div className="sidebar-header" style={{flexShrink: 0, marginBottom: '20px'}}>
            <h2 style={{marginBottom: '15px'}}>Conversations</h2>
            <button 
              onClick={handleNewMainChat}
              className="branch-btn"
              style={{fontSize: '12px', padding: '8px 14px', backgroundColor: '#28a745', color: 'white', border: '1px solid #28a745'}}
              title="Start a new main conversation"
            >
              + New Chat
            </button>
          </div>

          {/* Conversations Section */}
          <div className="conversations-section" style={{
            flexGrow: 1, 
            overflowY: 'auto',
            minHeight: 0,
            marginBottom: '20px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '12px',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div className="branch-section">
              <h3>Your Chats</h3>
              {conversationManager?.conversations?.size > 0 ? (
                Array.from(conversationManager.conversations.values()).map(conv => (
                  <div key={conv.id}>
                    <div 
                      className={`branch-item ${conversationManager?.currentConversationId === conv.id && conversationManager?.currentBranch === 'main' ? 'active' : ''}`}
                      onClick={() => {
                        conversationManager.currentConversationId = conv.id;
                        conversationManager.currentBranch = 'main';
                        const currentBranch = conversationManager.getCurrentBranch();
                        onMessagesUpdate(currentBranch?.messages || []);
                      }}
                      title={`Main conversation - Messages: ${conv.branches?.get('main')?.messages?.length || 0}`}
                      style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                    >
                      <span>
                        {Array.from(conv.branches.values()).filter(branch => branch.id !== 'main').length > 0 ? '📁 ' : ''}
                        {conv.title}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          fontSize: '14px',
                          borderRadius: '3px',
                          opacity: 0.7
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                        title="Delete conversation"
                      >
                        ×
                      </button>
                    </div>
                    {/* Show branches as sub-files under the main conversation */}
                    {conversationManager?.currentConversationId === conv.id && (
                      <div style={{marginLeft: '20px'}}>
                        {Array.from(conv.branches.values()).filter(branch => branch.id !== 'main').map(branch => {
                          const swipe = swipeState[branch.id];
                          const translateX = swipe?.isDragging ? Math.max(0, swipe.deltaX) : 0;
                          const showDelete = translateX > 50;
                          
                          return (
                            <div 
                              key={branch.id}
                              className={`branch-item swipeable ${conversationManager?.currentBranch === branch.id ? 'active' : ''}`}
                              onClick={() => !swipe?.isDragging && handleSwitchBranch(branch.id)}
                              onTouchStart={(e) => handleSwipeStart(branch.id, e)}
                              onTouchMove={(e) => handleSwipeMove(branch.id, e)}
                              onTouchEnd={(e) => handleSwipeEnd(branch.id, e)}
                              onMouseDown={(e) => handleSwipeStart(branch.id, e)}
                              onMouseMove={(e) => isMouseDragging && handleSwipeMove(branch.id, e)}
                              onMouseUp={(e) => handleSwipeEnd(branch.id, e)}
                              onMouseLeave={(e) => isMouseDragging && handleSwipeEnd(branch.id, e)}
                              style={{
                                fontSize: '13px', 
                                paddingLeft: '8px',
                                transform: `translateX(${translateX}px)`,
                                transition: swipe?.isDragging ? 'none' : 'transform 0.3s ease',
                                position: 'relative',
                                backgroundColor: showDelete ? '#ffebee' : undefined,
                                borderColor: showDelete ? '#f44336' : undefined,
                                cursor: swipe?.isDragging ? 'grabbing' : 'pointer'
                              }}
                            >
                              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <span>{branch.title}</span>
                                <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
                                  {showDelete && (
                                    <span style={{color: '#f44336', fontSize: '12px', opacity: 0.8}}>
                                      ← Swipe to delete
                                    </span>
                                  )}
                                  {/* Temporary delete button for testing */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteBranch(branch.id);
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--text-secondary)',
                                      cursor: 'pointer',
                                      padding: '2px 4px',
                                      fontSize: '12px',
                                      opacity: 0.6
                                    }}
                                    title="Delete branch (test button)"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                              {showDelete && (
                                <div 
                                  style={{
                                    position: 'absolute',
                                    right: -translateX,
                                    top: 0,
                                    bottom: 0,
                                    width: translateX,
                                    backgroundColor: '#f44336',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '12px'
                                  }}
                                >
                                  🗑️
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p style={{color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic'}}>
                  Start chatting to create branches
                </p>
              )}
            </div>
          </div>

          {/* Starred Messages Section */}
          <div className="starred-section" style={{
            flexShrink: 0, 
            maxHeight: '250px', 
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '12px',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <h3 style={{marginBottom: '15px', fontSize: '14px'}}>⭐ Starred Messages</h3>
            {(() => {
              const allStarredMessages = conversationManager?.getStarredMessages() || [];
              const starredMessages = filterStarredMessages(allStarredMessages, debouncedSearchQuery);
              
              if (allStarredMessages.length === 0) {
                return (
                  <p style={{color: 'var(--text-secondary)', fontSize: '12px', fontStyle: 'italic', textAlign: 'center'}}>
                    Star assistant responses to save them here
                  </p>
                );
              }
              
              return (
                <div>
                  {/* Search Input */}
                  <div style={{marginBottom: '12px', position: 'relative'}}>
                    <input
                      type="text"
                      value={starredSearchQuery}
                      onChange={handleSearchInputChange}
                      placeholder="Search starred messages..."
                      style={{
                        width: '100%',
                        padding: '6px 30px 6px 10px',
                        fontSize: '12px',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          clearSearch();
                        }
                      }}
                    />
                    {starredSearchQuery && (
                      <button
                        onClick={clearSearch}
                        style={{
                          position: 'absolute',
                          right: '6px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '2px',
                          opacity: 0.7
                        }}
                        title="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  
                  {starredMessages.length > 0 ? (
                    <div style={{maxHeight: '150px', overflowY: 'auto'}}>
                      {starredMessages.slice(0, 10).map(message => (
                        <div 
                          key={`${message.conversationId}_${message.branchId}_${message.id}`}
                          className="starred-message-item"
                          style={{
                            fontSize: '11px',
                            padding: '6px',
                            marginBottom: '6px',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            // Navigate to the starred message
                            conversationManager.currentConversationId = message.conversationId;
                            conversationManager.currentBranch = message.branchId;
                            const currentBranch = conversationManager.getCurrentBranch();
                            onMessagesUpdate(currentBranch?.messages || []);
                          }}
                          title="Click to navigate to this message"
                        >
                          <div style={{fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '3px'}}>
                            {message.conversationTitle} › {message.branchTitle}
                          </div>
                          <div style={{color: 'var(--text-secondary)', lineHeight: '1.3'}}>
                            {message.content.length > 80 
                              ? message.content.substring(0, 80) + '...' 
                              : message.content
                            }
                          </div>
                          <div style={{fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px'}}>
                            {new Date(message.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                      {starredMessages.length > 10 && (
                        <div style={{fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center', padding: '6px'}}>
                          Showing 10 of {starredMessages.length} 
                          {debouncedSearchQuery ? ` matching "${debouncedSearchQuery}"` : ` starred messages`}
                          {debouncedSearchQuery && allStarredMessages.length !== starredMessages.length && 
                            ` (${allStarredMessages.length} total)`
                          }
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{color: 'var(--text-secondary)', fontSize: '11px', fontStyle: 'italic', textAlign: 'center', padding: '15px 0'}}>
                      {debouncedSearchQuery ? (
                        <div>
                          <div>No starred messages found matching "{debouncedSearchQuery}"</div>
                          <button 
                            onClick={clearSearch}
                            style={{
                              marginTop: '6px',
                              background: 'none',
                              border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                              padding: '3px 6px',
                              fontSize: '10px',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            Clear search
                          </button>
                        </div>
                      ) : (
                        'Star assistant responses to save them here'
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Chat Container */}
        <div className="chat-container">
          {/* Header with breadcrumbs */}
          <div className="chat-header">
            <div className="breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <span 
                    className="breadcrumb-item"
                    onClick={() => handleBreadcrumbClick(index)}
                    style={{cursor: index === 0 && conversationManager?.currentBranch !== 'main' ? 'pointer' : 'default'}}
                  >
                    {crumb}
                  </span>
                  {index < breadcrumbs.length - 1 && (
                    <span className="breadcrumb-separator">›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="messages">
            {messages.length === 0 ? (
              <div className="empty-state">
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`message ${message.sender}`}
                  data-message-id={message.id}
                >
                  <div className="message-content">
                    {message.sender === 'assistant' ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      message.content
                    )}
                    {/* Star button for all assistant messages */}
                    {message.sender === 'assistant' && (
                      <div style={{marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-start'}}>
                        <button 
                          className="branch-btn"
                          onClick={() => handleStarToggle(message.id)}
                          title={message.starred ? "Remove from favorites" : "Add to favorites"}
                          style={{
                            backgroundColor: message.starred ? '#ffd700' : 'transparent',
                            color: message.starred ? '#333' : 'var(--text-primary)',
                            border: `1px solid ${message.starred ? '#ffd700' : 'var(--border)'}`,
                            fontSize: '12px',
                            padding: '6px 10px'
                          }}
                        >
                          {message.starred ? '⭐ Starred' : '☆ Star'}
                        </button>
                        {/* Branch buttons - only show in main branch */}
                        {conversationManager?.currentBranch === 'main' && (
                          <>
                            <button 
                              className="branch-btn"
                              onClick={() => handleBranch(message.id)}
                              title="Create a new branch from this message"
                            >
                              🌿 Branch from full response
                            </button>
                            {selectedText && selectedMessageId === message.id && (
                              <button 
                                className="branch-btn"
                                onClick={handleTextBranch}
                                title="Create a new branch from selected text"
                                style={{backgroundColor: 'var(--accent)', color: 'white'}}
                              >
                                🌿 Branch from selection
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            
            {isLoading && (
              <div className="message assistant">
                <div className="message-content loading">
                  Claude is thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="input-area">
            <form className="input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                disabled={isLoading}
                className="input-field"
              />
              <button 
                type="submit" 
                disabled={isLoading || !inputValue.trim()}
                className="send-btn"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Condensed Log Overlay */}
      <CondensedLog
        open={condensedLogOpen}
        onClose={() => setCondensedLogOpen(false)}
        onJumpTo={handleJumpToMessage}
        onRefresh={handleCondensedLogRefresh}
        condensedItems={condensedItems}
        isLoading={condensedLoading}
        parseError={condensedParseError}
        errorMessage={condensedErrorMessage}
      />

    </div>
  );
};

export default ChatInterface;
