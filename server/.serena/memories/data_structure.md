# Data Structure and Architecture

## Core Data Model

### Conversation Structure
```javascript
{
  id: "conversation_id",
  title: "Main Conversation",
  branches: Map<string, Branch>,
  currentBranch: "main",
  breadcrumbs: ["Main Channel"],
  createdAt: Date
}
```

### Branch Structure
```javascript
{
  id: "branch_id",
  title: "Branch Name", 
  parentBranchId: "parent_id" | null,
  parentMessageId: "message_id" | null,
  messages: Message[],
  branches: Map<string, Branch>,
  createdAt: Date,
  isActive: boolean
}
```

### Message Structure
```javascript
{
  id: "message_id",
  content: "message content",
  sender: "user" | "assistant",
  timestamp: Date,
  branchPoint: boolean,
  availableBranches: string[]
}
```

## Key Architecture Decisions

### Tree-Based Branching
- **Map structures**: Used for O(1) branch lookups and flexible nesting
- **Parent references**: Each branch tracks its parent for breadcrumb generation
- **Message anchoring**: Branches are created from specific message points
- **Context inheritance**: Child branches inherit parent message history

### State Management
- **LocalStorage persistence**: Client-side storage for prototype simplicity
- **Map serialization**: Custom JSON serialization handles Map structures
- **Version tracking**: Data structure versioning for future migrations
- **Error boundaries**: Comprehensive validation and error recovery

### API Integration
- **Proxy pattern**: Backend handles Claude API authentication and CORS
- **Message formatting**: Transform internal message format to Claude API format
- **Auto-naming**: AI-generated branch names using conversation context
- **Fallback handling**: Default names when AI generation fails

### Security Considerations
- **Input validation**: All user inputs sanitized and validated
- **ID generation**: Cryptographically secure random IDs
- **XSS prevention**: Content sanitization in message display
- **API key protection**: Secure backend environment variable storage