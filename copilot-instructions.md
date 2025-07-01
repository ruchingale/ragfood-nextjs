# RAG Food App - Updated Architecture

## Key Requirements

### Vector Database & Embeddings
- Use Upstash Vector as the primary vector database
- When provisioning Upstash in Vercel, you **must** select mixedbread-ai/mxbai-embed-large-v1 as the embedding model
- Remove ALL explicit embedding calls to external services (Cohere, Clarifai, etc.) from the core pipeline
- Upstash's built-in embedding model will handle all vectorization automatically

### Provider Switching
- Maintain environment variable based provider switching (VECTOR_DB_TYPE)
- Default to Upstash Vector but allow fallback to simple in-memory store
- Environment configuration must support easy switching between providers
- Structure codebase to support adding new vector store backends in future

## Technical Implementation

### Database Strategy:
- Use Upstash Vector as primary vector database
- Leverage Upstash's built-in embedding functionality with mixedbread-ai/mxbai-embed-large-v1 model
- Keep simple in-memory vector store as fallback for local development
- Remove explicit embedding calls to external services (Cohere, Clarifai, etc.)
- Ensure environment variable based configuration for provider switching

### Type Safety:
- Use zod schemas for all data validation
- Strong TypeScript typing throughout
- Validate environment variables on app startup
- Type-safe Server Action inputs/outputs

### Performance:
- Show loading states during embedding and querying
- Display progress indicators for long-running operations
- Handle large datasets efficiently
- Optimize for both local and cloud deployments

### Migration Strategy:
- Design codebase to support both local and cloud providers
- Use factory pattern or similar for provider switching
- Include clear documentation for switching between phases
- Environment variable based configuration switching

The current data is located in the root folder foods.json and should be accessible to Server Actions at runtime.

## Dependencies & Packages

### Required NPM Packages:
```bash
# Core dependencies
npm install @upstash/vector zod groq-sdk

# UI dependencies (if not already installed)
npm install @radix-ui/react-* class-variance-authority clsx tailwind-merge
npm install lucide-react @hookform/resolvers react-hook-form

# Development dependencies
npm install @types/node
```

### Environment Variables Setup:
Create `.env.local` file with appropriate variables:
```env
# Upstash Vector (Primary)
VECTOR_DB_TYPE=upstash
UPSTASH_VECTOR_URL=your_upstash_url
UPSTASH_VECTOR_TOKEN=your_upstash_token

# LLM Provider (Cloud)
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.2-3b-preview
```

Or for local development fallback:
```env
# Simple Vector DB (Fallback)
VECTOR_DB_TYPE=simple
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=llama3.2
```

## Project Structure Requirements

### Core Files to Create/Modify:
1. **Server Actions**: `app/actions/` directory with:
   - `embedding-actions.ts` - Handle embedding operations
   - `query-actions.ts` - Handle RAG queries
   - `data-actions.ts` - Handle food data loading

2. **Components**: `components/` directory with:
   - `EmbeddingSection.tsx` - Embed button and status
   - `QuestionSection.tsx` - Question input form
   - `ResponseSection.tsx` - Two-column results display
   - `RagDetails.tsx` - RAG search details component

3. **Types**: `lib/types.ts` - TypeScript interfaces and types

4. **Configuration**: `lib/config.ts` - Environment variable validation

5. **Provider Factory**: `lib/providers/` directory with:
   - `database.ts` - Vector database abstraction
   - `embeddings.ts` - Embedding service abstraction  
   - `llm.ts` - LLM service abstraction

### File Replacement Strategy:
- Replace default `app/page.tsx` with new RAG interface
- Modify `app/layout.tsx` to include proper metadata and styling
- Keep existing Shadcn components and add new ones as needed

## Implementation Checklist

### Phase 1 - Local Development:
- [ ] Install required dependencies
- [ ] Set up environment variables
- [ ] Create vector database abstraction layer
- [ ] Implement ChromaDB integration
- [ ] Create Ollama embedding service
- [ ] Create Ollama LLM service  
- [ ] Build Server Actions for data operations
- [ ] Design and implement UI components
- [ ] Test embedding and querying functionality

### Phase 2 - Cloud Migration Prep:
- [ ] Set up Upstash Vector with built-in mxbai-embed-large-v1
- [ ] Remove external embedding service dependencies
- [ ] Add Groq LLM service
- [ ] Implement provider switching logic
- [ ] Test environment variable configuration
- [ ] Prepare for Vercel deployment

### When provisioning Upstash:
- [ ] Select mixedbread-ai/mxbai-embed-large-v1 as the embedding model
- [ ] Configure proper index dimensions (1024 for mxbai-embed-large-v1)
- [ ] Test vector similarity search with sample queries
- [ ] Verify proper error handling for rate limits

## CLI Commands (PowerShell)
All terminal commands should be optimized for Windows PowerShell:
```powershell
# Check for existing dev server
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -eq "node"}

# Kill existing dev server if needed
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Installation
npm install chromadb @upstash/vector zod groq-sdk

# Development (check if port 3000 is available first)
npm run dev

# Build and test
npm run build; npm run start

# Type checking
npx tsc --noEmit

# Lint checking
npm run lint
```

## Development Workflow
1. **Server Check**: Always verify if development server is running before starting work
2. **Port Management**: Use port 3000 as primary, 3001 as fallback
3. **Code Changes**: After making changes, verify:
   - TypeScript compilation succeeds
   - No ESLint errors exist
   - Hot reload picks up changes
   - Browser console shows no errors
4. **Terminal Monitoring**: Keep terminal output visible to catch:
   - Compilation errors
   - Runtime errors
   - API call failures
   - Type validation issues
