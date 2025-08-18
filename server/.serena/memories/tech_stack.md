# Technology Stack

## Frontend
- **Framework**: React 18.2.0 with modern hooks
- **Build Tool**: Vite 4.4.5 with React plugin
- **Styling**: Custom CSS with Claude-inspired design system
- **Icons**: Lucide React 0.263.1
- **Development**: Hot reload, modern ES modules

## Backend  
- **Runtime**: Node.js with Express 4.18.2
- **HTTP Client**: Axios 1.5.0 for Claude API calls
- **Environment**: dotenv 16.3.1 for configuration
- **CORS**: cors 2.8.5 for cross-origin requests
- **Development**: nodemon 3.0.1 for hot reload

## External APIs
- **Claude API**: Anthropic's Claude 3 Haiku model
- **Authentication**: API key-based authentication
- **Endpoints**: `/v1/messages` for conversations, custom endpoints for branch naming

## Data Storage
- **Frontend**: Local storage for prototype persistence (ready for backend integration)
- **Backend**: Stateless API proxy, no persistent storage
- **Data Structure**: Tree-based conversation model with nested branch support

## Development Tools
- **Package Management**: npm with lock files
- **Module System**: ES modules with JSX
- **Code Organization**: Component-based architecture
- **Environment**: Dual-server development (frontend:5173, backend:3001)