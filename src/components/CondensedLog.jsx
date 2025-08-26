import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const CondensedItem = ({ 
  item, 
  depth = 0, 
  onJumpTo, 
  onClose, 
  isSelected, 
  onSelect,
  searchTerm = '',
  expandedItems,
  onToggleExpanded 
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.has(item.id);
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return null;
    }
  };

  // Highlight matching text
  const highlightText = (text, search) => {
    if (!search.trim()) return text;
    
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="condensed-highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  const handleTitleClick = () => {
    onJumpTo(item.sourceMessageId);
    onClose();
  };

  const handleChevronClick = (e) => {
    e.stopPropagation();
    onToggleExpanded(item.id);
  };

  const handleSelect = () => {
    onSelect(item.id);
  };

  const timestamp = formatTimestamp(item.timestamp);

  return (
    <div className={clsx("condensed-item", depth > 0 && "condensed-item-child")}>
      <div 
        className={clsx("condensed-item-row", isSelected && "condensed-item-selected")}
        onClick={handleSelect}
      >
        {hasChildren && (
          <button
            className="condensed-chevron"
            onClick={handleChevronClick}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        
        <button
          className="condensed-item-button"
          onClick={handleTitleClick}
          title={`Jump to message: ${item.sourceMessageId}`}
        >
          <span className="condensed-item-title">
            {highlightText(item.title, searchTerm)}
          </span>
          {timestamp && (
            <span className="condensed-timestamp">{timestamp}</span>
          )}
        </button>
      </div>
      
      {hasChildren && (
        <div className={clsx(
          "condensed-item-children",
          !isExpanded && "condensed-item-children-collapsed"
        )}>
          {item.children.map(child => (
            <CondensedItem
              key={child.id}
              item={child}
              depth={depth + 1}
              onJumpTo={onJumpTo}
              onClose={onClose}
              isSelected={isSelected}
              onSelect={onSelect}
              searchTerm={searchTerm}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CondensedLog = ({ 
  open, 
  onClose, 
  onJumpTo, 
  condensedItems, 
  isLoading, 
  onRefresh, 
  parseError = false,
  errorMessage = null 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());

  // Initialize expanded state - default to all expanded
  useEffect(() => {
    if (condensedItems.length > 0 && expandedItems.size === 0) {
      const allItemIds = new Set();
      condensedItems.forEach(item => {
        if (item.children && item.children.length > 0) {
          allItemIds.add(item.id);
        }
      });
      setExpandedItems(allItemIds);
    }
  }, [condensedItems, expandedItems.size]);

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return condensedItems;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    
    return condensedItems.filter(item => {
      const parentMatches = item.title.toLowerCase().includes(searchLower);
      const childMatches = item.children?.some(child => 
        child.title.toLowerCase().includes(searchLower)
      );
      
      if (parentMatches || childMatches) {
        // If parent matches, show all children
        // If only children match, show only matching children
        if (!parentMatches && childMatches) {
          return {
            ...item,
            children: item.children.filter(child => 
              child.title.toLowerCase().includes(searchLower)
            )
          };
        }
        return item;
      }
      
      return false;
    }).filter(Boolean);
  }, [condensedItems, debouncedSearchTerm]);

  // Get all selectable items (flattened)
  const getAllSelectableItems = useCallback(() => {
    const items = [];
    filteredItems.forEach(item => {
      items.push(item);
      if (item.children && expandedItems.has(item.id)) {
        items.push(...item.children);
      }
    });
    return items;
  }, [filteredItems, expandedItems]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;
      
      const selectableItems = getAllSelectableItems();
      const currentIndex = selectableItems.findIndex(item => item.id === selectedItemId);

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedItemId(selectableItems[currentIndex - 1].id);
          } else if (selectableItems.length > 0) {
            setSelectedItemId(selectableItems[selectableItems.length - 1].id);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < selectableItems.length - 1 && currentIndex !== -1) {
            setSelectedItemId(selectableItems[currentIndex + 1].id);
          } else if (selectableItems.length > 0) {
            setSelectedItemId(selectableItems[0].id);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedItemId) {
            const selectedItem = selectableItems.find(item => item.id === selectedItemId);
            if (selectedItem) {
              onJumpTo(selectedItem.sourceMessageId);
              onClose();
            }
          }
          break;
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, onClose, selectedItemId, getAllSelectableItems, onJumpTo]);

  // Set first item as selected when opening
  useEffect(() => {
    if (open && filteredItems.length > 0 && !selectedItemId) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [open, filteredItems, selectedItemId]);

  // Prevent background scroll when overlay is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [open]);

  const handleToggleExpanded = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="condensed-backdrop"
            onClick={onClose}
          />
          
          {/* Sliding panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring', 
              stiffness: 260, 
              damping: 30,
              duration: 0.3
            }}
            className="condensed-panel"
          >
            {/* Header */}
            <div className="condensed-header">
              <h3 className="condensed-title">Condensed Chat Log</h3>
              <div className="condensed-header-actions">
                <button
                  className="condensed-refresh-btn"
                  onClick={onRefresh}
                  disabled={isLoading}
                  title="Refresh summaries"
                >
                  ↻
                </button>
                <span className="condensed-hint">⌘+J</span>
                <button 
                  className="condensed-close-btn"
                  onClick={onClose}
                  title="Close (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Search Bar */}
            {condensedItems.length > 0 && (
              <div className="condensed-search">
                <div className="condensed-search-input-wrapper">
                  <input
                    type="text"
                    className="condensed-search-input"
                    placeholder="Search summaries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="condensed-search-clear"
                      onClick={handleClearSearch}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="condensed-content">
              {isLoading ? (
                <div className="condensed-loading">
                  <div className="condensed-spinner"></div>
                  <p>Generating summary...</p>
                </div>
              ) : parseError ? (
                <div className="condensed-error">
                  <div className="condensed-error-icon">⚠️</div>
                  <p className="condensed-error-message">
                    {errorMessage || 'Failed to parse AI response'}
                  </p>
                  <button
                    className="condensed-retry-btn"
                    onClick={onRefresh}
                    disabled={isLoading}
                  >
                    Retry
                  </button>
                </div>
              ) : filteredItems.length === 0 && debouncedSearchTerm ? (
                <div className="condensed-no-results">
                  <p>No matches found for "{debouncedSearchTerm}"</p>
                  <button
                    className="condensed-clear-search-btn"
                    onClick={handleClearSearch}
                  >
                    Clear search
                  </button>
                </div>
              ) : condensedItems.length === 0 ? (
                <div className="condensed-empty">
                  <p>No summary available yet.</p>
                  <p className="condensed-empty-hint">
                    Start a conversation to see a condensed overview here.
                  </p>
                </div>
              ) : (
                <div className="condensed-items">
                  {filteredItems.map(item => (
                    <CondensedItem
                      key={item.id}
                      item={item}
                      depth={0}
                      onJumpTo={onJumpTo}
                      onClose={onClose}
                      isSelected={selectedItemId === item.id}
                      onSelect={setSelectedItemId}
                      searchTerm={debouncedSearchTerm}
                      expandedItems={expandedItems}
                      onToggleExpanded={handleToggleExpanded}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="condensed-footer">
              <p className="condensed-footer-text">
                {condensedItems.length > 0 
                  ? "↑/↓ navigate • Enter to jump • Click titles to jump"
                  : "Click any item to jump to the original message"
                }
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CondensedLog;