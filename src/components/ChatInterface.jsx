import React, { useState } from 'react';
import { Paperclip, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

const ChatInterface = ({ messages = [], onSendMessage, isLoading = false }) => {
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

  return (
    <>
      {/* Navigation Sidebar */}
      <nav className="nav-sidebar">
        {/* Logo Header */}
        <div className="nav-header">
          <div className="claude-logo">
            <svg width="68" height="16" viewBox="0 0 68 16" fill="none">
              <path d="M0 16V0h4.8v12.8h8V16H0zm20.4 0V9.6c0-2.4-1.2-3.6-3.6-3.6s-3.6 1.2-3.6 3.6V16h-4.8V4.8h4.8v1.2c1.2-1.2 2.8-1.6 4.8-1.6 4 0 7.2 2.4 7.2 7.2V16h-4.8zm16.8 0.4c-4.4 0-8-3.2-8-8s3.6-8 8-8 8 3.2 8 8-3.6 8-8 8zm0-12c-2.4 0-3.6 1.6-3.6 4s1.2 4 3.6 4 3.6-1.6 3.6-4-1.2-4-3.6-4zm19.2 11.6V4.8h4.8v1.2c1.2-1.2 2.8-1.6 4.8-1.6v4.4c-0.4 0-0.8 0-1.2 0-2.4 0-3.6 0.8-3.6 3.2V16h-4.8z" fill="white"/>
            </svg>
          </div>
          <button className="close-panel-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="nav-items">
          {/* Top Navigation */}
          <div className="nav-section">
            <div className="nav-item active">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 3L8 1L14 3V13L8 15L2 13V3Z" fill="#D97757"/>
                <circle cx="8" cy="8" r="2" fill="#D97757"/>
              </svg>
              <span>Start new chat</span>
            </div>
            <div className="nav-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4H14V12H2V4Z" stroke="#BFBFBA" strokeWidth="1.5"/>
              </svg>
              <span>Projects</span>
            </div>
          </div>

          {/* Starred Section */}
          <div className="nav-section">
            <div className="nav-section-header">Starred</div>
            <div className="nav-list">
              {Array.from({length: 3}).map((_, i) => (
                <div key={i} className="nav-item">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M2 4H13V11H2V4Z" stroke="#BFBFBA" strokeWidth="1.5"/>
                  </svg>
                  <span>Project conversation</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recents Section */}
          <div className="nav-section">
            <div className="nav-section-header">Recents</div>
            <div className="nav-list">
              {Array.from({length: 8}).map((_, i) => (
                <div key={i} className="nav-item">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M2 3H13V12H2V3Z" stroke="#FFFFFF" strokeWidth="1.5"/>
                  </svg>
                  <span>Recent conversation</span>
                </div>
              ))}
            </div>
            <div className="view-all-link">
              <span>All Projects</span>
              <ArrowRight size={16} color="#BFBFBA" />
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="user-profile">
          <div className="plan-badge">
            <span>Professional plan</span>
          </div>
          <div className="profile-info">
            <div className="profile-content">
              <div className="profile-avatar">PM</div>
              <span className="profile-email">patrick@patrickmorgan.org</span>
            </div>
            <ChevronDown size={16} color="rgba(255,255,255,0.6)" />
          </div>
        </div>

        {/* Footer */}
        <div className="nav-footer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 15C11.866 15 15 11.866 15 8C15 4.134 11.866 1 8 1C4.134 1 1 4.134 1 8C1 11.866 4.134 15 8 15Z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
          </svg>
          <div className="help-support">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 13C10.314 13 13 10.314 13 7C13 3.686 10.314 1 7 1C3.686 1 1 3.686 1 7C1 10.314 3.686 13 7 13Z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
              <path d="M5.5 5.25C5.5 4.284 6.284 3.5 7.25 3.5C8.216 3.5 9 4.284 9 5.25C9 6.216 8.216 7 7.25 7H7V8.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="7" cy="10.5" r="0.5" fill="rgba(255,255,255,0.6)"/>
            </svg>
            <span>Help & support</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-container">
          {/* Plan Badge */}
          <div className="plan-chip">
            <span>Professional Plan</span>
          </div>

          {/* Headline */}
          <div className="headline">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L28 16L24 20L20 16V28H12V16L8 20L4 16L16 4Z" fill="#D97757"/>
            </svg>
            <h1>Good evening, Patrick</h1>
          </div>

          {/* Search Interface */}
          <div className="search-container">
            <div className="search-box">
              <div className="search-input">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="How can Claude help you today?"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'white',
                    fontSize: '15px',
                    fontFamily: 'Styrene B LC'
                  }}
                />
              </div>
              <div className="search-bottom">
                <button className="attach-btn">
                  <Paperclip size={16} color="rgba(255,255,255,0.6)" />
                </button>
                
                <div className="model-controls">
                  <button className="model-selector">
                    <span>3.5 Sonnet</span>
                    <ChevronDown size={16} color="rgba(255,255,255,0.6)" />
                  </button>
                  
                  <button className="project-selector">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 3H10V9H2V3Z" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
                    </svg>
                    <span>Use a project</span>
                    <ChevronDown size={16} color="rgba(255,255,255,0.6)" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Chats */}
          <div className="recent-chats">
            <div className="recent-chats-header">
              <div className="header-left">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2 4H18V16H2V4Z" stroke="#207FDE" strokeWidth="1.5"/>
                </svg>
                <span>Your recent chats</span>
                <ChevronUp size={16} color="rgba(255,255,255,0.6)" />
              </div>
              <div className="view-all">
                <span>View all</span>
                <ArrowRight size={16} color="rgba(255,255,255,0.6)" />
              </div>
            </div>
            
            <div className="chat-grid">
              {Array.from({length: 6}).map((_, i) => (
                <div key={i} className="chat-card">
                  <div className="chat-header">
                    {i % 2 === 0 ? (
                      <div className="project-label">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 3H10V9H2V3Z" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
                        </svg>
                        <span>How to use Claude</span>
                      </div>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M2 4H18V16H2V4Z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
                      </svg>
                    )}
                  </div>
                  <div className="chat-title">Strategies for Maximizing Interaction</div>
                  <div className="chat-time">3 hours ago</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        {messages.length > 0 && (
          <div className="chat-messages" style={{
            position: 'absolute',
            top: '200px',
            left: '50px',
            right: '50px',
            bottom: '100px',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '16px',
            padding: '20px',
            overflow: 'auto'
          }}>
            {messages.map((message) => (
              <div key={message.id} className={`message-bubble ${message.sender}`}>
                <div className="message-content">
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-bubble assistant">
                <div className="message-content">Claude is typing...</div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
};

export default ChatInterface;