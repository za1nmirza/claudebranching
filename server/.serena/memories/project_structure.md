# Project Structure

## Root Directory
```
claudebranching/
├── README.md                 # Project overview and demo instructions
├── SETUP.md                  # Setup and troubleshooting guide
├── CODING_PRINCIPLES.md      # Code style and conventions
├── REFACTORING_SUMMARY.md    # Recent refactoring notes
├── package.json              # Frontend dependencies (React, Vite)
├── package-lock.json         # Frontend dependency lock
├── vite.config.js           # Vite configuration
├── index.html               # Entry HTML file
├── src/                     # Frontend source code
└── server/                  # Backend API server
```

## Frontend Structure (src/)
```
src/
├── main.jsx                 # React entry point
├── App.jsx                  # Main app component
├── components/              # React components
│   ├── ChatInterface.jsx    # Main chat container
│   ├── MessageBubble.jsx    # Individual message display
│   ├── Breadcrumbs.jsx      # Navigation breadcrumb trail
│   └── ConversationTree.jsx # Sidebar tree navigation
├── utils/                   # Core utilities
│   ├── conversationManager.js # Core branching logic
│   ├── claudeApi.js         # API communication
│   ├── idGenerator.js       # Secure ID generation
│   ├── validation.js        # Input validation
│   └── errorHandling.js     # Error handling utilities
├── config/
│   └── index.js             # Configuration settings
├── constants/
│   ├── api.js               # API endpoints and settings
│   └── timing.js            # Timing constants
└── styles/
    └── components.css       # Claude-inspired design system
```

## Backend Structure (server/)
```
server/
├── package.json             # Backend dependencies (Express, Axios)
├── package-lock.json        # Backend dependency lock
├── server.js                # Express server with Claude API proxy
├── .env                     # Environment variables (API keys)
└── node_modules/            # Backend dependencies
```

## Key Architecture Patterns
- **Component-based React**: Modular UI components with clear responsibilities
- **Tree-structured data**: Conversation branching with nested Map structures
- **API proxy pattern**: Backend proxies Claude API to handle CORS and authentication
- **Client-side state**: LocalStorage persistence with Map-based data structures
- **Validation layer**: Input sanitization and security checks throughout
- **Error handling**: Comprehensive error boundaries and logging