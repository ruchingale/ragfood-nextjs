The following is my python code that implements a Retrieval-Augmented Generation (RAG) system using ChromaDB and Ollama for food-related queries. It loads food data, generates embeddings, and allows users to ask questions about food items.

I want to create an equivalent TypeScript/Next.js application with the following specifications:

## Development Environment
- **Platform**: Windows machine using PowerShell as default CLI
- **Starting Point**: Existing Next.js boilerplate project that needs to be replaced/modified
- **Target**: Complete RAG system implementation

## Development Server Management
- **Always check for existing dev server**: Before starting development, check if a server is running on port 3000 or 3001
- **Reuse existing servers**: If a development server is already running, use it instead of starting a new one
- **Port preferences**: Primary port should be 3000, fallback to 3001 if 3000 is occupied
- **Server lifecycle**: If server needs to be restarted due to major changes, kill the existing process and start fresh
- **Monitor server logs**: Always check terminal output for compilation errors, warnings, and runtime issues
- **Hot reload verification**: Ensure changes are being picked up by the development server's hot reload functionality

## Code Quality Standards
- **Strong TypeScript typing**: All code must be strongly typed with explicit interfaces and type annotations
- **Lint error resolution**: Always check for and resolve ESLint errors after making changes
- **Type safety validation**: Use TypeScript compiler checks to ensure no type errors exist
- **Zod schema validation**: All data inputs/outputs must use Zod schemas for runtime validation
- **Error handling**: Implement comprehensive error handling with proper TypeScript error types
- **No `any` types**: Avoid using `any` type unless absolutely necessary, use proper type definitions instead

## Core Requirements

1. **Equivalent functionality** written in TypeScript, Next.js, Shadcn, with strong type safety and good practices.
2. **Dual deployment strategy**: Start with local development using ChromaDB + Ollama, then migrate to cloud providers for Vercel deployment.
3. **UI using Shadcn components** for a modern, responsive design.
4. **Server Actions only** - all backend functionality must strictly use Next.js Server Actions with zod schemas for data validation and type safety.
5. **No custom API routes** - everything through Server Actions.

## Phase 1: Local Development Setup
- **Vector Database**: ChromaDB (local persistent storage)
- **Embeddings**: Ollama with `mxbai-embed-large` model
- **LLM**: Ollama with `llama3.2` model
- **Data Source**: `foods.json` in root folder (loaded at runtime, not build time)

## Phase 2: Cloud Deployment (Vercel)
- **Vector Database**: Upstash Vector Database (Vercel Storage compatible)
- **Embeddings**: Clarifai with `mxbai-embed-large-v1` model (URL: `https://clarifai.com/mixedbread-ai/embed/models/mxbai-embed-large-v1`)
- **LLM**: Groq cloud with llama model (e.g., `llama-3.2-3b-preview` or similar)

## Environment Configuration
Use environment variables to control provider switching:
```
# Database
VECTOR_DB_TYPE=chroma|upstash
CHROMA_PATH=./chroma_db
UPSTASH_VECTOR_URL=
UPSTASH_VECTOR_TOKEN=

# AI Providers  
EMBEDDING_PROVIDER=ollama|clarifai
LLM_PROVIDER=ollama|groq

# Ollama (Local)
OLLAMA_BASE_URL=http://localhost:11434
EMBED_MODEL=mxbai-embed-large
LLM_MODEL=llama3.2

# Clarifai (Cloud)
CLARIFAI_PAT=
CLARIFAI_MODEL_URL=https://clarifai.com/mixedbread-ai/embed/models/mxbai-embed-large-v1

# Groq (Cloud)
GROQ_API_KEY=
GROQ_MODEL=llama-3.2-3b-preview
```

## UI Requirements

### Simple Layout Design:
- **Top Section**: Embed button with status indicator (shows embedding progress/completion)
- **Middle Section**: Question input field with submit button
- **Bottom Section**: Two-column layout side-by-side:
  - **Left Column**: LLM Response (the final answer)
  - **Right Column**: RAG Details (similarity scores, source documents, document IDs)

### UI Components:
- Use Shadcn components throughout
- Keep design simple and clean - no modals, dialogs, or complex interactions
- Show loading states for embedding and query processes
- Display connection status and active providers
- Include example questions to help users get started

### RAG Details Display:
Show detailed information about the retrieval process:
- Document text snippets that were retrieved
- Similarity scores for each result
- Document IDs for reference
- Number of results returned
- Query processing time

## Data Management

### Database Schema:
Keep the exact same simple schema as the current ChromaDB implementation:
- Document text (original text for retrieval)
- Embeddings (vector representations)
- Document IDs (unique identifiers)
- Metadata (region, type when available)

### Data Loading:
- Load `foods.json` at runtime via Server Actions, not at build time
- Support incremental embedding (only add new items not already embedded)
- Enhance text with region/type information before embedding (same as Python version)
- Store original text as retrievable context

### Optional Feature:
- UI for updating/editing the `foods.json` data (nice to have, not critical)

## Error Handling & Rate Limiting

### Graceful Failures:
- Handle API failures with user-friendly error messages
- Manage rate limits from free tier services (Clarifai, Groq)
- Show retry options when rate limited
- Provide fallback messaging when services are unavailable
- Console logging for developers, clean messages for users

### Rate Limit Strategy:
- Display clear error messages when rate limited
- Provide manual retry button
- Don't queue requests automatically
- Allow app to work with existing embeddings even if new embedding fails

## Technical Implementation

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
npm install chromadb @upstash/vector zod groq-sdk

# UI dependencies (if not already installed)
npm install @radix-ui/react-* class-variance-authority clsx tailwind-merge
npm install lucide-react @hookform/resolvers react-hook-form

# Development dependencies
npm install @types/node
```

### Environment Variables Setup:
Create `.env.local` file with appropriate variables for local development:
```env
# Start with local setup
VECTOR_DB_TYPE=chroma
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
EMBED_MODEL=mxbai-embed-large
LLM_MODEL=llama3.2
CHROMA_PATH=./chroma_db
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
- [ ] Add Upstash Vector database provider
- [ ] Add Clarifai embedding service
- [ ] Add Groq LLM service
- [ ] Implement provider switching logic
- [ ] Test environment variable configuration
- [ ] Prepare for Vercel deployment

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


```python

import os
import json
import chromadb
import requests

# Constants
CHROMA_DIR = "chroma_db"
COLLECTION_NAME = "foods"
JSON_FILE = "foods.json"
EMBED_MODEL = "mxbai-embed-large"
LLM_MODEL = "llama3.2"

# Load data
with open(JSON_FILE, "r", encoding="utf-8") as f:
    food_data = json.load(f)

# Setup ChromaDB
chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)

# Ollama embedding function
def get_embedding(text):
    response = requests.post("http://localhost:11434/api/embeddings", json={
        "model": EMBED_MODEL,
        "prompt": text
    })
    return response.json()["embedding"]

# Add only new items
existing_ids = set(collection.get()['ids'])
new_items = [item for item in food_data if item['id'] not in existing_ids]

if new_items:
    print(f"🆕 Adding {len(new_items)} new documents to Chroma...")
    for item in new_items:
        # Enhance text with region/type
        enriched_text = item["text"]
        if "region" in item:
            enriched_text += f" This food is popular in {item['region']}."
        if "type" in item:
            enriched_text += f" It is a type of {item['type']}."

        emb = get_embedding(enriched_text)

        collection.add(
            documents=[item["text"]],  # Use original text as retrievable context
            embeddings=[emb],
            ids=[item["id"]]
        )
else:
    print("✅ All documents already in ChromaDB.")

# RAG query
def rag_query(question):
    # Step 1: Embed the user question
    q_emb = get_embedding(question)

    # Step 2: Query the vector DB
    results = collection.query(query_embeddings=[q_emb], n_results=3)

    # Step 3: Extract documents
    top_docs = results['documents'][0]
    top_ids = results['ids'][0]

    # Step 4: Show friendly explanation of retrieved documents
    print("\n🧠 Retrieving relevant information to reason through your question...\n")

    for i, doc in enumerate(top_docs):
        print(f"🔹 Source {i + 1} (ID: {top_ids[i]}):")
        print(f"    \"{doc}\"\n")

    print("📚 These seem to be the most relevant pieces of information to answer your question.\n")

    # Step 5: Build prompt from context
    context = "\n".join(top_docs)

    prompt = f"""Use the following context to answer the question.

Context:
{context}

Question: {question}
Answer:"""

    # Step 6: Generate answer with Ollama
    response = requests.post("http://localhost:11434/api/generate", json={
        "model": LLM_MODEL,
        "prompt": prompt,
        "stream": False
    })

    # Step 7: Return final result
    return response.json()["response"].strip()


# Interactive loop
print("\n🧠 RAG is ready. Ask a question (type 'exit' to quit):\n")
while True:
    question = input("You: ")
    if question.lower() in ["exit", "quit"]:
        print("👋 Goodbye!")
        break
    answer = rag_query(question)
    print("🤖:", answer)
