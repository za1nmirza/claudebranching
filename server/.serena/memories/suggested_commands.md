# Suggested Commands for Development

## Development Workflow

### Starting the Application
```bash
# 1. Start Backend Server (Required for Claude API)
cd server
npm install
npm start                    # Production mode
# OR
npm run dev                  # Development mode with nodemon

# 2. Start Frontend (in new terminal, from project root)
npm install
npm run dev                  # Vite dev server on http://localhost:5173
```

### Building and Deployment
```bash
# Build for production
npm run build               # Creates dist/ folder with optimized assets
npm run preview             # Preview production build locally
```

### Backend Commands
```bash
cd server
npm start                   # Start production server (port 3001)
npm run dev                 # Start with nodemon for development
```

### Health Checks
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Check if frontend is accessible
curl http://localhost:5173
```

### Testing Integration
```bash
# Full integration test
# 1. Ensure both servers are running
# 2. Open http://localhost:5173
# 3. Send a message to test Claude API integration
# 4. Click "Branch" button to test branching functionality
```

## Environment Setup
```bash
# Backend environment variables (create server/.env)
CLAUDE_API_KEY=your_claude_api_key_here
PORT=3001
```

## Troubleshooting Commands
```bash
# Check what's running on ports
lsof -i :3001                # Backend port
lsof -i :5173                # Frontend port

# Clear browser storage
# Open DevTools > Application > Storage > Clear storage

# Reset application data
# Delete localStorage key 'claudeBranchingData'
```

## System Requirements
- Node.js (version compatible with React 18 and Express 4)
- npm or yarn package manager
- Modern browser with ES6+ support
- Internet connection for Claude API calls