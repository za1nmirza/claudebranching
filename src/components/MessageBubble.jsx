import React, { useState, useRef } from 'react';
import { GitBranch, Loader2, MessageSquare } from 'lucide-react';

const MessageBubbleComponent = ({ message, onCreateBranch, onCreateBranchWithText, showBranchButton, isCreatingBranch }) => {
  const isAssistant = message.sender === 'assistant';
  const [selectedText, setSelectedText] = useState('');
  const [showTextBranchButton, setShowTextBranchButton] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const messageRef = useRef(null);

  const handleTextSelection = () => {
    if (!isAssistant) return; // Only allow selection on assistant messages
    
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length > 0) {
      setSelectedText(text);
      
      // Get selection position for positioning the button
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPosition({
        x: rect.right + 10,
        y: rect.top
      });
      
      setShowTextBranchButton(true);
    } else {
      setSelectedText('');
      setShowTextBranchButton(false);
    }
  };

  const handleCreateTextBranch = () => {
    if (selectedText && onCreateBranchWithText) {
      console.log('🌿 Creating branch with selected text:', selectedText);
      onCreateBranchWithText(message.id, selectedText);
      setShowTextBranchButton(false);
      setSelectedText('');
    }
  };

  return (
    <div className={`message-bubble ${isAssistant ? 'assistant' : 'user'}`}>
      <div className="message-content">
        <div 
          ref={messageRef}
          className="message-text"
          onMouseUp={handleTextSelection}
          onMouseDown={() => setShowTextBranchButton(false)}
          style={{ userSelect: isAssistant ? 'text' : 'none' }}
        >
          {message.content}
        </div>
        <div className="message-meta">
          <span className="timestamp">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
      
      {isAssistant && showBranchButton && (
        <button 
          className={`branch-button ${isCreatingBranch ? 'creating' : ''}`}
          onClick={() => {
            console.log('🔴 BRANCH BUTTON CLICKED! Message ID:', message.id);
            console.log('🔴 onCreateBranch function:', typeof onCreateBranch);
            onCreateBranch(message.id);
          }}
          disabled={isCreatingBranch}
          title={isCreatingBranch ? "Creating branch..." : "Create a new branch from this response"}
        >
          {isCreatingBranch ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <GitBranch size={16} />
              <span>Branch</span>
            </>
          )}
        </button>
      )}
      
      {/* Floating button for selected text branching */}
      {showTextBranchButton && (
        <button 
          className="text-branch-button"
          onClick={handleCreateTextBranch}
          style={{
            position: 'fixed',
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y}px`,
            zIndex: 1000,
            background: '#4A90E2',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title={`Branch with: "${selectedText.slice(0, 50)}${selectedText.length > 50 ? '...' : ''}"`}
        >
          <MessageSquare size={14} />
          <span>Branch</span>
        </button>
      )}
    </div>
  );
};

export const MessageBubble = React.memo(MessageBubbleComponent);

export default MessageBubble;