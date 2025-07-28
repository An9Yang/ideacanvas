# IdeaCanvas Project Analysis

## Executive Summary

IdeaCanvas is an AI-powered flow chart generation tool built with Next.js 15, React Flow, and Azure OpenAI. It transforms natural language descriptions into visual development workflows, targeting non-technical users who need to plan application development.

### Key Technologies
- **Frontend**: Next.js 15.1.7, React 18.2, TypeScript 5.1.6
- **UI/Visualization**: React Flow 11.11.4, Tailwind CSS 3.4.1, Radix UI
- **State Management**: Zustand 4.5.2 with persistence
- **AI Integration**: Azure OpenAI (GPT-4.5-preview), OpenAI SDK 4.85.3
- **Storage**: Azure Blob Storage 12.27.0, localStorage
- **Internationalization**: Custom i18n system (Chinese/English)

## Architecture Overview

### Project Structure
```
ideacanvas/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── flows/         # Flow CRUD operations
│   │   ├── generate-flow/ # AI flow generation
│   │   └── health/        # Health check endpoint
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── flow/             # Flow-related components
│   ├── prompt/           # Prompt input component
│   ├── settings/         # Settings components
│   └── ui/               # Reusable UI components
├── lib/                  # Core library code
│   ├── config/           # Configuration
│   ├── services/         # Business logic services
│   ├── stores/           # Zustand stores
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── hooks/                # Custom React hooks
├── scripts/              # Utility scripts
└── tests/                # Test files
```

## Core Features

### 1. AI-Powered Flow Generation
- Natural language to flow chart conversion
- Bilingual support (Chinese/English)
- Real-time progress tracking via Server-Sent Events (SSE)
- Automatic retry mechanism for reliability
- Node types: Product, External, Context, Guide, Document

### 2. Interactive Canvas
- Drag-and-drop node manipulation
- Visual connections between nodes
- Node content editing
- Undo/redo functionality
- Responsive design with zoom/pan

### 3. Cloud Storage Integration
- Azure Blob Storage for persistence
- Automatic save after generation
- Flow management (CRUD operations)
- Graceful localStorage fallback
- Quota management

### 4. Performance Optimizations
- Dynamic component imports
- Debounced state updates
- Limited history storage (3 states)
- Node content truncation (4000 chars)
- SSE streaming for long operations

## API Endpoints

### 1. `/api/health` (GET)
- Health check and Azure OpenAI connection test
- Returns: `{ status, azure_openai, timestamp }`

### 2. `/api/generate-flow` (POST)
- Generates flow from natural language prompt
- Input: `{ prompt: string }`
- Output: SSE stream with progress updates
- Final data: `{ nodes, edges, userLanguage }`

### 3. `/api/flows` (GET, POST)
- GET: List all user flows
- POST: Save new flow
- Input (POST): `{ name, nodes, edges }`

### 4. `/api/flows/[id]` (GET, PUT, DELETE)
- CRUD operations for individual flows
- PUT input: `{ name?, nodes?, edges? }`

## State Management

### Flow Store (Main)
```typescript
interface FlowState {
  flows: Flow[]
  currentFlow: Flow | null
  nodes: Node[]
  edges: Edge[]
  history: HistoryState[]
  currentHistoryIndex: number
  generationProgress: { status: string, progress: number }
  isGenerating: boolean
  // ... actions
}
```

### Language Store
- Manages UI language (zh/en)
- Persisted to localStorage

### Settings Store
- OpenAI API key management
- Persisted to localStorage

### Chat Store (Unused)
- Legacy component for chat interface
- Can be removed

## Key Components

### Flow Components
1. **FlowCanvas**: Main canvas with React Flow
2. **FlowNode**: Individual node rendering
3. **FlowToolbar**: Action buttons
4. **FlowList**: Cloud flow management
5. **NodeDetails**: Detailed node view
6. **PromptInput**: Natural language input

### UI Architecture
- Error boundaries for fault tolerance
- Lazy loading for performance
- Toast notifications for feedback
- Dialog system for modals
- Custom theming with Tailwind

## Services Architecture

### AI Services
- **azure-ai.ts**: Primary AI service using GPT-4.5-preview
- **flow-generation.service.ts**: Flow generation orchestration
- **prompt-generator.ts**: System prompt creation

### Storage Services
- **azure-storage.service.ts**: Azure Blob Storage integration
- **cloud-storage.service.ts**: Storage abstraction layer
- localStorage fallback with quota management

### Error Handling
- **error-service.ts**: Centralized error management
- **error-handler.ts**: Error parsing and fixing
- **json-fixer.ts**: Malformed JSON repair

## Dependencies Overview

### Core Dependencies
- **next**: 15.1.7 - React framework
- **react/react-dom**: 18.2.0 - UI library
- **typescript**: 5.1.6 - Type safety
- **reactflow**: 11.11.4 - Flow chart rendering
- **zustand**: 4.5.2 - State management

### AI/Cloud Integration
- **openai**: 4.85.3 - OpenAI SDK
- **@azure/storage-blob**: 12.27.0 - Azure storage

### UI/Styling
- **tailwindcss**: 3.4.1 - Utility-first CSS
- **@radix-ui/***: Various - Headless UI components
- **lucide-react**: 0.446.0 - Icon library
- **clsx**: 2.1.1 - Conditional classes
- **tailwind-merge**: 2.5.2 - Class merging

### Utilities
- **uuid**: 9.0.1 - ID generation
- **zod**: 3.22.3 - Schema validation
- **date-fns**: 4.1.0 - Date formatting
- **marked**: 12.0.0 - Markdown parsing

## Known Issues & Technical Debt

### Issues to Address
1. TypeScript errors in multiple files
2. Hardcoded Azure endpoint in config
3. Placeholder user authentication
4. Excessive `any` types usage
5. No automated tests

### Unused Code (Can be removed)
- `/components/chat/` directory
- `/components/results/` directory
- `/components/storage/` directory
- Unused UI components (see CLAUDE.md)
- Multiple OpenAI service files

### Architecture Improvements Needed
1. `generateFlow` function too complex (165 lines)
2. API route handlers need refactoring
3. Better error handling consistency
4. Implement proper authentication
5. Add comprehensive test coverage

## Performance Considerations

### Current Optimizations
- Dynamic imports for heavy components
- Debounced localStorage updates
- Limited history states (3)
- Node content truncation
- SSE streaming for long operations

### Bottlenecks
- localStorage quota limitations
- Large flow rendering performance
- No pagination for flow list
- Synchronous node updates

## Security Considerations

### Current State
- No authentication system
- API keys stored in environment variables
- CORS not explicitly configured
- No rate limiting

### Recommendations
1. Implement user authentication
2. Add API rate limiting
3. Configure CORS properly
4. Validate all user inputs
5. Implement proper access control

## Deployment Configuration

### Environment Variables Required
```
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT_NAME=
AZURE_STORAGE_ACCOUNT_NAME=
AZURE_STORAGE_ACCOUNT_KEY=
AZURE_STORAGE_CONTAINER_NAME=ideacanvas-flows
```

### Build Commands
```bash
npm run build    # Production build
npm run dev      # Development server
npm run lint     # Linting
npm run type-check # TypeScript validation
```

## Future Enhancement Opportunities

### High Priority
1. Fix all TypeScript errors
2. Implement user authentication
3. Add automated testing
4. Refactor complex functions
5. Remove unused code

### Medium Priority
1. Add flow templates
2. Implement collaborative editing
3. Export flows to various formats
4. Add version control for flows
5. Improve mobile responsiveness

### Low Priority
1. Add more node types
2. Implement flow execution
3. Add analytics tracking
4. Create flow marketplace
5. Add AI-powered suggestions

## Migration Considerations

### For Major Updates
1. Backup all localStorage data
2. Migrate flow format if changed
3. Update Azure services gradually
4. Test SSE streaming thoroughly
5. Validate all API endpoints

### Breaking Changes to Watch
1. React Flow API changes
2. Next.js app directory evolution
3. Azure OpenAI API updates
4. Zustand v5 migration
5. TypeScript strict mode

## Conclusion

IdeaCanvas is a well-structured application with clear separation of concerns and modern architecture. The main areas for improvement are:

1. **Code Quality**: Fix TypeScript errors and remove unused code
2. **Security**: Implement proper authentication and access control
3. **Testing**: Add comprehensive test coverage
4. **Performance**: Optimize for larger flows and better caching
5. **Features**: Expand capabilities while maintaining simplicity

The codebase is ready for a major iteration with these improvements in mind.