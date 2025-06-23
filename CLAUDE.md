# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IdeaCanvas is an AI-powered flow chart generation tool that helps non-technical users visualize and plan application development. It uses Next.js, React Flow, and Azure OpenAI to create an interactive canvas where users can generate, visualize, and manage development workflows.

## Essential Commands

Build and run development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Lint and type check (ALWAYS run before completing tasks):
```bash
npm run lint
npm run type-check
```

## Architecture Overview

### Core Flow System
- **Flow Canvas** (`components/flow/flow-canvas.tsx`): Main React Flow canvas with dynamic loading
- **Flow Store** (`lib/stores/flow-store.ts`): Zustand store managing nodes, edges, and flow state
- **Node Types**: Product (white), External (blue), Context (yellow), Guide, Document (green)

### AI Integration
- **Azure OpenAI Service** (`lib/services/azure-ai.ts`): Primary AI service using GPT-4.5-preview
- **Flow Generation API** (`app/api/generate-flow/route.ts`): Handles natural language to flow conversion

### State Management
- Zustand stores with persistence in `lib/stores/`
- Flow state includes nodes, edges, history, and metadata

## Known Issues & Redundancies

### Unused Components (can be removed)
- `/components/chat/` - Entire directory unused
- `/components/results/` - Unused panel component
- `/components/storage/` - Empty directory
- Most UI components in `/components/ui/` except: badge, button, callout, card, dialog, dropdown-menu, input, label, scroll-area, textarea, toast, toggle

### Service Duplication
Multiple OpenAI service files exist - use `azure-ai.ts` as the primary service.

### Architecture Problems
1. `generateFlow` function in flow-store.ts (lines 125-290) needs refactoring
2. API route handler in generate-flow/route.ts is too complex (190 lines)
3. Hardcoded Azure endpoint in config.ts
4. Excessive use of `any` types throughout codebase

## Development Guidelines

### When Adding Features
1. Check existing flow components before creating new ones
2. Use the established node color scheme
3. Follow the existing Zustand store patterns
4. Always implement both Chinese and English translations

### When Fixing Bugs
1. Check error-handler.ts for existing error handling patterns
2. Test with both language modes (CN/EN)
3. Ensure flow canvas remains responsive

### AI Model Configuration
- Primary: Azure OpenAI GPT-4.5-preview
- Endpoint is environment-specific (check .env files)
- Temperature: 0.7, Max tokens: 16000

### Critical Performance Considerations
- Flow canvas uses dynamic imports for performance
- Node content is truncated at 4000 characters
- History is limited to 10 states to prevent memory issues

## Testing Approach
Currently no automated tests. Manual testing focuses on:
- Flow generation from various prompts
- Node manipulation on canvas
- Language switching
- Save/load functionality

## Cloud Storage Integration

### Azure Blob Storage Setup
The project now supports Azure Blob Storage for persistent flow storage, solving localStorage quota issues.

#### Configuration
Add to `.env`:
```
AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name
AZURE_STORAGE_ACCOUNT_KEY=your_storage_account_key
AZURE_STORAGE_CONTAINER_NAME=ideacanvas-flows
```

#### Features
- **Automatic Save**: Flows are automatically saved to cloud after generation
- **Hybrid Storage**: localStorage for caching, Azure Blob for persistence
- **Graceful Degradation**: Works without cloud storage configured
- **Quota Management**: Automatically cleans old history when localStorage is full

#### API Endpoints
- `GET /api/flows` - List all flows
- `POST /api/flows` - Save new flow
- `GET /api/flows/[id]` - Get specific flow
- `PUT /api/flows/[id]` - Update flow
- `DELETE /api/flows/[id]` - Delete flow

#### Known Limitations
- Currently uses placeholder user ID ('default-user')
- No authentication implemented yet
- Manual flow management UI not yet implemented