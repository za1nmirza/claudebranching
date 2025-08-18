const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
app.use(express.json());

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

if (!CLAUDE_API_KEY) {
  console.error('CLAUDE_API_KEY environment variable is required');
  process.exit(1);
}

// Utility function to format messages for Claude API
function formatMessagesForClaude(messages) {
  return messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
}

// Chat endpoint - main conversation with Claude
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, maxTokens = 1000 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    console.log('Sending request to Claude API with', messages.length, 'messages');

    const response = await axios.post(CLAUDE_API_URL, {
      model: 'claude-3-haiku-20240307',
      max_tokens: maxTokens,
      messages: formatMessagesForClaude(messages)
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });

    const claudeResponse = response.data.content[0].text;
    console.log('Claude API response received, length:', claudeResponse.length);

    res.json({ 
      response: claudeResponse,
      success: true 
    });

  } catch (error) {
    console.error('Claude API Error:', error.response?.data || error.message);
    
    // Return detailed error for debugging
    res.status(500).json({ 
      error: 'Failed to get response from Claude',
      details: error.response?.data || error.message,
      success: false
    });
  }
});

// Branch name generation endpoint
app.post('/api/generate-branch-name', async (req, res) => {
  try {
    const { lastUserMessage, lastAssistantMessage } = req.body;

    if (!lastUserMessage || !lastAssistantMessage) {
      return res.status(400).json({ error: 'Both user and assistant messages are required' });
    }

    const nameGenerationPrompt = `Based on this conversation exchange, generate a short, descriptive branch name (2-4 words max) for a conversation branch:

User: "${lastUserMessage}"
Assistant: "${lastAssistantMessage}"

Generate a concise branch name that captures the specific topic or direction of this conversation thread. Examples: "Deep Dive", "Alternative Approach", "Practical Examples", "Technical Details", etc.

Respond with only the branch name, no additional text.`;

    console.log('Generating branch name for conversation...');

    const response = await axios.post(CLAUDE_API_URL, {
      model: 'claude-3-haiku-20240307',
      max_tokens: 20,
      messages: [{ role: 'user', content: nameGenerationPrompt }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });

    let branchName = response.data.content[0].text.trim();
    
    // Clean up the response - remove quotes and ensure reasonable length
    branchName = branchName.replace(/['"]/g, '');
    if (branchName.length > 25) {
      branchName = branchName.substring(0, 25) + '...';
    }

    console.log('Generated branch name:', branchName);

    res.json({ 
      branchName: branchName || getDefaultBranchName(),
      success: true 
    });

  } catch (error) {
    console.error('Branch name generation error:', error.response?.data || error.message);
    
    // Fallback to default name
    res.json({ 
      branchName: getDefaultBranchName(),
      success: false,
      error: 'Used fallback name due to API error'
    });
  }
});

// Default branch names fallback
function getDefaultBranchName() {
  const defaultNames = [
    'Discussion Branch',
    'Topic Exploration', 
    'Deep Dive',
    'Follow-up',
    'Alternative View',
    'Detailed Analysis'
  ];
  return defaultNames[Math.floor(Math.random() * defaultNames.length)];
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!CLAUDE_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`Claude Branching API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`API Key configured: ${CLAUDE_API_KEY ? 'Yes' : 'No'}`);
});