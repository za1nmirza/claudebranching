import React, { useState } from 'react';

const ChatInterface = ({ messages = [], onSendMessage, isLoading = false, conversationManager, onMessagesUpdate, conversationUpdate }) => {
  const [inputValue, setInputValue] = useState('');

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

  const handleBranch = async (messageId) => {
    try {
      // Find the message to branch from
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      // Find recent context for auto-naming
      const messageIndex = messages.findIndex(m => m.id === messageId);
      const recentMessages = messages.slice(Math.max(0, messageIndex - 2), messageIndex + 1);
      
      let branchTitle = 'Branch';

      // Try to auto-generate branch name based on recent conversation
      if (recentMessages.length > 0) {
        try {
          const conversationContext = recentMessages.map(m => `${m.sender}: ${m.content}`).join('\n');
          
          const response = await fetch('http://localhost:3001/api/generate-branch-name', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lastUserMessage: recentMessages.find(m => m.sender === 'user')?.content || '',
              lastAssistantMessage: recentMessages.find(m => m.sender === 'assistant')?.content || message.content
            })
          });
          
          const data = await response.json();
          if (data.success && data.branchName) {
            branchTitle = data.branchName;
          }
        } catch (error) {
          console.log('Failed to auto-generate branch name, using default');
        }
      }

      // Let user edit the auto-generated name
      const userTitle = prompt(`Create new branch:`, branchTitle);
      if (userTitle) {
        // Create a branch from the current message within the same conversation
        const newBranch = conversationManager.createBranchFromMessage(messageId, userTitle);
        if (newBranch) {
          // Clear the new branch to start fresh
          newBranch.messages = [];
          // Switch to the new branch and show empty messages
          onMessagesUpdate([]);
        }
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Failed to create branch. Please try again.');
    }
  };

  const handleNewMainChat = () => {
    try {
      // Create a new conversation with temporary name
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

  const conversation = conversationManager?.getCurrentConversation();
  const breadcrumbs = conversation?.breadcrumbs || ['Main'];
  const branches = conversationManager?.getAllActiveBranches() || [];

  return (
    <div className="app">
      <div className="chat-wrapper">
        {/* Sidebar */}
        <div className="sidebar">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2>Conversations</h2>
            <button 
              onClick={handleNewMainChat}
              className="branch-btn"
              style={{fontSize: '12px', padding: '6px 10px'}}
              title="Start a new main conversation"
            >
              + New Chat
            </button>
          </div>
          
          {/* Branch Tree */}
          <div className="branch-tree">
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
                    >
                      📁 {conv.title}
                    </div>
                    {/* Show branches as sub-files under the main conversation */}
                    {conversationManager?.currentConversationId === conv.id && (
                      <div style={{marginLeft: '20px'}}>
                        {Array.from(conv.branches.values()).filter(branch => branch.id !== 'main').map(branch => (
                          <div 
                            key={branch.id}
                            className={`branch-item ${conversationManager?.currentBranch === branch.id ? 'active' : ''}`}
                            onClick={() => handleSwitchBranch(branch.id)}
                            style={{fontSize: '13px', paddingLeft: '8px'}}
                          >
                            📄 {branch.title} ({branch.messages?.length || 0})
                          </div>
                        ))}
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
        </div>

        {/* Chat Container */}
        <div className="chat-container">
          {/* Header with breadcrumbs */}
          <div className="chat-header">
            <div className="breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <span className="breadcrumb-item">{crumb}</span>
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
                <h3>Welcome to Claude Branching Chat</h3>
                <p>Start a conversation and create branches to explore different topics!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`message ${message.sender}`}>
                  <div className="message-content">
                    {message.content}
                    {message.sender === 'assistant' && (
                      <div className="message-actions">
                        <button 
                          className="branch-btn"
                          onClick={() => handleBranch(message.id)}
                          title="Create a new conversation"
                        >
                          Branch
                        </button>
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
    </div>
  );
};

export default ChatInterface;