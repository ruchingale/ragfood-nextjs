'use server'

import { createVectorDatabase } from '@/lib/providers/database'
import { createEmbeddingProvider } from '@/lib/providers/embeddings'
import { createLlmProvider } from '@/lib/providers/llm'
import { QuerySchema, type RagQueryResponse } from '@/lib/types'
import { DEFAULT_RAG_RESULTS } from '@/lib/config'

// Global provider instances (singleton pattern)
let dbInstance: ReturnType<typeof createVectorDatabase> | null = null
let embeddingInstance: ReturnType<typeof createEmbeddingProvider> | null = null
let llmInstance: ReturnType<typeof createLlmProvider> | null = null
let isInitialized = false

// Initialize providers with proper error handling
async function initializeProviders() {
  try {
    if (!dbInstance) {
      console.log('🔧 Creating vector database instance...')
      dbInstance = createVectorDatabase()
    }
    
    if (!isInitialized) {
      console.log('🔧 Initializing vector database...')
      await dbInstance.initialize()
      isInitialized = true
    }
    
    if (!embeddingInstance) {
      console.log('🔧 Creating embedding provider instance...')
      embeddingInstance = createEmbeddingProvider()
    }
    
    if (!llmInstance) {
      console.log('🔧 Creating LLM provider instance...')
      llmInstance = createLlmProvider()
    }
    
    return { 
      db: dbInstance, 
      embedding: embeddingInstance,
      llm: llmInstance
    }
  } catch (error) {
    console.error('❌ Failed to initialize providers:', error)
    // Reset instances on failure so they can be retried
    dbInstance = null
    embeddingInstance = null
    llmInstance = null
    isInitialized = false
    throw error
  }
}

// Main RAG query function with progressive results
export async function ragQuery(request: unknown): Promise<RagQueryResponse> {
  try {
    // Validate request
    const { question } = QuerySchema.parse(request)
    
    console.log(`🔍 Processing question: "${question}"`)
    const startTime = Date.now()
    
    const { db, embedding, llm } = await initializeProviders()
    
    // Step 1: Embed the user question
    console.log('📝 Generating question embedding...')
    const questionEmbedding = await embedding.getEmbedding(question)
    
    // Step 2: Query the vector database
    console.log('🔍 Searching vector database...')
    const searchResults = await db.query(questionEmbedding, DEFAULT_RAG_RESULTS)
    
    if (searchResults.documents.length === 0) {
      return {
        success: false,
        error: 'No relevant information found in the database',
      }
    }
    
    // Step 3: Log retrieved documents for debugging
    console.log('\n🧠 Retrieved relevant information:')
    searchResults.documents.forEach((doc, i) => {
      console.log(`🔹 Source ${i + 1} (ID: ${searchResults.ids[i]}):`)
      console.log(`    "${doc}"`)
      if (searchResults.distances?.[i]) {
        console.log(`    Distance: ${searchResults.distances[i].toFixed(4)}`)
      }
    })
    
    // Step 4: Build context from retrieved documents
    const context = searchResults.documents.join('\n')
    
    // Step 5: Create prompt for LLM
    const prompt = `Use the following context to answer the question.

Context:
${context}

Question: ${question}
Answer:`

    // Step 6: Generate response with LLM
    console.log('🤖 Generating LLM response...')
    const llmResponse = await llm.generateResponse(prompt)
    
    const totalTime = Date.now() - startTime
    
    // Convert distances to similarity scores (1 - distance)
    const similarities = searchResults.distances?.map(distance => 
      Math.max(0, 1 - distance)
    )
    
    console.log(`✅ RAG query completed in ${totalTime}ms`)
    
    return {
      success: true,
      llmResponse: llmResponse.response,
      ragDetails: {
        documents: searchResults.documents,
        ids: searchResults.ids,
        similarities,
        processingTime: totalTime,
        resultCount: searchResults.documents.length,
      },
    }
    
  } catch (error) {
    console.error('❌ RAG query failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// New function to get just RAG search results quickly
export async function getRagSearchResults(request: unknown) {
  try {
    // Validate request
    const { question } = QuerySchema.parse(request)
    
    console.log(`🔍 Getting RAG search results for: "${question}"`)
    const startTime = Date.now()
    
    const { db } = await initializeProviders()
    
    // Query the vector database directly with the question text
    // Upstash will handle embedding internally
    console.log('🔍 Searching vector database...')
    const searchResults = await db.query(question, DEFAULT_RAG_RESULTS)
    
    if (searchResults.documents.length === 0) {
      return {
        success: false,
        error: 'No relevant information found in the database',
      }
    }
    
    const searchTime = Date.now() - startTime
    
    // Convert distances to similarity scores (1 - distance)
    const similarities = searchResults.distances?.map(distance => 
      Math.max(0, 1 - distance)
    )
    
    console.log(`✅ RAG search completed in ${searchTime}ms`)
    
    return {
      success: true,
      ragDetails: {
        documents: searchResults.documents,
        ids: searchResults.ids,
        similarities,
        processingTime: searchTime,
        resultCount: searchResults.documents.length,
      },
    }
    
  } catch (error) {
    console.error('❌ RAG search failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// New function to get LLM response using provided context
export async function getLlmResponse(question: string, context: string) {
  try {
    console.log('🤖 Generating LLM response...')
    const startTime = Date.now()
    
    const { llm } = await initializeProviders()
    
    // Create prompt for LLM
    const prompt = `Use the following context to answer the question.

Context:
${context}

Question: ${question}
Answer:`

    // Generate response with LLM
    const llmResponse = await llm.generateResponse(prompt)
    
    const responseTime = Date.now() - startTime
    
    console.log(`✅ LLM response completed in ${responseTime}ms`)
    
    return {
      success: true,
      response: llmResponse.response,
      processingTime: responseTime,
    }
    
  } catch (error) {
    console.error('❌ LLM response failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// Test connection to all providers
export async function testConnection() {
  try {
    const { db, embedding, llm } = await initializeProviders()
    
    // Test database connection
    const existingIds = await db.getExistingIds()
    
    // Test embedding service
    const testEmbedding = await embedding.getEmbedding('test')
    
    // Test LLM service
    const testResponse = await llm.generateResponse('Say "Hello, I am working!" in one sentence.')
    
    return {
      success: true,
      tests: {
        database: {
          status: 'connected',
          embeddedDocuments: existingIds.length,
        },
        embedding: {
          status: 'connected',
          dimensions: testEmbedding.length,
        },
        llm: {
          status: 'connected',
          response: testResponse.response,
          processingTime: testResponse.processingTime,
        },
      },
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
