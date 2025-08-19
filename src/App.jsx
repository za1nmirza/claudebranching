import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import ConversationManager from './utils/conversationManager';
import './styles.css';

const conversationManager = new ConversationManager();

function App() {
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationUpdate, setConversationUpdate] = useState(0);

  useEffect(() => {
    // Check URL parameters for specific branch/conversation
    const urlParams = new URLSearchParams(window.location.search);
    const branchId = urlParams.get('branch');
    const conversationId = urlParams.get('conversation');
    
    // Try to load existing conversation or create new one
    const loaded = conversationManager.loadFromStorage();
    if (!loaded) {
      const newConversation = conversationManager.createConversation("Chat with Claude");
      setCurrentConversation(newConversation);
    } else {
      setCurrentConversation(conversationManager.getCurrentConversation());
    }
    
    // If URL parameters specify a specific branch/conversation, switch to it
    if (conversationId && branchId) {
      try {
        conversationManager.currentConversationId = conversationId;
        conversationManager.currentBranch = branchId;
        const currentBranch = conversationManager.getCurrentBranch();
        if (currentBranch) {
          setMessages(currentBranch.messages);
          setCurrentConversation(conversationManager.getCurrentConversation());
        }
      } catch (error) {
        console.error('Error loading specific branch from URL:', error);
      }
    } else {
      // Load current branch messages
      const currentBranch = conversationManager.getCurrentBranch();
      if (currentBranch) {
        setMessages(currentBranch.messages);
      }
    }
  }, []);

  const sendMessage = async (content) => {
    setIsLoading(true);
    
    try {
      // Ensure we have an active conversation
      if (!conversationManager.getCurrentConversation()) {
        const newConversation = conversationManager.createConversation("Chat with Claude");
        setCurrentConversation(newConversation);
      }
      
      // Add user message
      const userMessage = conversationManager.addMessage(content, 'user');
      const currentBranch = conversationManager.getCurrentBranch();
      setMessages([...currentBranch.messages]);

      // Check if this is the first message in the conversation to auto-generate name
      const isFirstMessage = currentBranch.messages.length === 1;

      // Send to Claude API
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentBranch.messages,
          maxTokens: 1000
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Add Claude's response
        const assistantMessage = conversationManager.addMessage(data.response, 'assistant');
        const updatedBranch = conversationManager.getCurrentBranch();
        setMessages([...updatedBranch.messages]);

        // Auto-generate conversation name after first exchange
        if (isFirstMessage) {
          console.log('First message detected, generating conversation name...');
          try {
            const nameResponse = await fetch('http://localhost:3001/api/generate-conversation-name', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                conversationContext: `${content} ${data.response}`
              })
            });
            
            const nameData = await nameResponse.json();
            console.log('Name generation response:', nameData);
            
            if (nameData.success && nameData.conversationName) {
              // Update conversation title
              const conversation = conversationManager.getCurrentConversation();
              if (conversation) {
                console.log('Updating conversation title from', conversation.title, 'to', nameData.conversationName);
                conversation.title = nameData.conversationName;
                conversationManager._saveToStorage();
                // Force component re-render to show new name
                setConversationUpdate(prev => prev + 1);
              }
            }
          } catch (error) {
            console.log('Failed to auto-generate conversation name:', error);
          }
        }
      } else {
        console.error('Claude API error:', data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <ChatInterface 
        messages={messages}
        onSendMessage={sendMessage}
        isLoading={isLoading}
        conversationManager={conversationManager}
        onMessagesUpdate={setMessages}
        conversationUpdate={conversationUpdate}
      />
    </div>
  );
}

export default App;