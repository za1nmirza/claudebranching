# Setup Instructions for Claude Chat Branching Prototype

## Quick Start

### 1. Environment Setup
```bash
cd server
cp .env.example .env
```
Edit `server/.env` and add your Anthropic API key:
```
CLAUDE_API_KEY=your_actual_api_key_here
PORT=3001
```
Get your API key from: https://console.anthropic.com/

### 2. Start the Backend Server (Required for Claude API)
```bash
cd server
npm install
npm start
```
The backend will run on http://localhost:3001

### 3. Start the Frontend (in a new terminal)
```bash
npm install
npm run dev
```
The frontend will run on http://localhost:5173

### 4. Test the Integration
1. Open http://localhost:5173
2. Send a message and wait for Claude's response
3. Click the "Branch" button to create a new conversation branch
4. Watch as the interface switches to the new branch automatically

## Troubleshooting

### Backend Issues
- Check if port 3001 is free: `lsof -i :3001`
- Verify API key in `server/.env`
- Check backend logs for errors

### Frontend Issues  
- Check browser console for errors
- Verify backend is running: `curl http://localhost:3001/api/health`
- Clear browser cache/localStorage if needed

### API Issues
- Verify the Claude API key is valid
- Check backend logs for detailed API error messages
- Ensure internet connection for API calls

## Features to Test

1. **Real Claude Conversations**: Send messages and get actual Claude responses
2. **Auto-Branching**: Click "Branch" button for instant branch creation with auto-generated names
3. **Navigation**: Use breadcrumbs and sidebar to switch between branches
4. **Context Preservation**: All branches maintain conversation history

## Development Notes

- Frontend calls backend API instead of Anthropic directly (CORS issue resolved)
- API key securely stored in backend environment variables
- Real-time error handling and logging for debugging