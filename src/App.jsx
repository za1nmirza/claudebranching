import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import ConversationManager from './utils/conversationManager';
import './styles/components.css';
import './styles.css';

const conversationManager = new ConversationManager();

function App() {
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Try to load existing conversation or create new one
    const loaded = conversationManager.loadFromStorage();
    if (!loaded) {
      const newConversation = conversationManager.createConversation("Chat with Claude");
      setCurrentConversation(newConversation);
    } else {
      setCurrentConversation(conversationManager.getCurrentConversation());
    }
    
    // Load current branch messages
    const currentBranch = conversationManager.getCurrentBranch();
    if (currentBranch) {
      setMessages(currentBranch.messages);
    }
  }, []);

  const sendMessage = async (content) => {
    setIsLoading(true);
    
    try {
      // Add user message
      const userMessage = conversationManager.addMessage(content, 'user');
      const currentBranch = conversationManager.getCurrentBranch();
      setMessages([...currentBranch.messages]);

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
      />
    </div>
  );
}

export default App;