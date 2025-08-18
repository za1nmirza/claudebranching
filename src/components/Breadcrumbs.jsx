import React from 'react';
import { ChevronRight, X } from 'lucide-react';

const BreadcrumbsComponent = ({ breadcrumbs, onNavigate, onCloseBranch, currentBranch }) => {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return (
    <div className="breadcrumbs">
      <div className="breadcrumb-trail">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <button
              className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
              onClick={() => onNavigate && onNavigate(index)}
            >
              {crumb}
            </button>
            {index < breadcrumbs.length - 1 && (
              <ChevronRight size={14} className="breadcrumb-separator" />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {breadcrumbs.length > 1 && currentBranch !== 'main' && (
        <button 
          className="close-branch-button"
          onClick={() => onCloseBranch && onCloseBranch()}
          title="Close this branch and return to parent"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export const Breadcrumbs = React.memo(BreadcrumbsComponent);

export default Breadcrumbs;