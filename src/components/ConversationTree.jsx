import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MessageCircle, GitBranch } from 'lucide-react';

const TreeNodeComponent = ({ node, onNodeClick, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleClick = () => {
    onNodeClick(node.id);
  };

  return (
    <div className="tree-node">
      <div 
        className={`tree-node-content ${node.isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren && (
          <button className="tree-toggle" onClick={handleToggle}>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
        
        <div className="tree-icon">
          {level === 0 ? <MessageCircle size={14} /> : <GitBranch size={14} />}
        </div>
        
        <span className="tree-label">{node.title}</span>
      </div>

      {hasChildren && isExpanded && (
        <div className="tree-children">
          {node.children.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              onNodeClick={onNodeClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeNode = React.memo(TreeNodeComponent);

const ConversationTreeComponent = ({ tree, onBranchSwitch, isVisible }) => {
  if (!tree || !isVisible) return null;

  return (
    <div className="conversation-tree">
      <div className="tree-header">
        <h3>Conversation Branches</h3>
      </div>
      <div className="tree-content">
        <TreeNode node={tree} onNodeClick={onBranchSwitch} />
      </div>
    </div>
  );
};

export const ConversationTree = React.memo(ConversationTreeComponent);

export default ConversationTree;