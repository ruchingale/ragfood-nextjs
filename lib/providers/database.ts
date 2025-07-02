import { Index } from '@upstash/vector'
import { config, COLLECTION_NAME } from '../config'
import { RagResult, FoodMetadata } from '../types'
import * as fs from 'fs'
import * as path from 'path'

// Abstract database interface
export interface VectorDatabase {
  initialize(): Promise<void>
  addDocuments(documents: string[], embeddings: number[][], ids: string[]): Promise<void>
  query(query: string | number[], nResults: number): Promise<RagResult>
  getExistingIds(): Promise<string[]>
  close?(): Promise<void>
}

// Simple in-memory vector database for local development
class SimpleVectorDatabase implements VectorDatabase {
  private documents: { id: string; text: string; embedding: number[] }[] = []
  private dataFile: string

  constructor() {
    this.dataFile = path.join(process.cwd(), 'simple_vector_db.json')
  }

  async initialize(): Promise<void> {
    try {
      // Load existing data if file exists
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'))
        this.documents = data.documents || []
        console.log(`✅ Simple Vector DB initialized with ${this.documents.length} existing documents`)
      } else {
        console.log('✅ Simple Vector DB initialized (empty)')
      }
    } catch (error) {
      console.error('❌ Failed to initialize Simple Vector DB:', error)
      throw new Error(`Simple Vector DB initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async addDocuments(documents: string[], embeddings: number[][], ids: string[]): Promise<void> {
    // Add new documents
    for (let i = 0; i < documents.length; i++) {
      // Remove existing document with same ID if it exists
      this.documents = this.documents.filter(doc => doc.id !== ids[i])
      
      // Add new document
      this.documents.push({
        id: ids[i],
        text: documents[i],
        embedding: embeddings[i]
      })
    }

    // Save to file
    await this.saveToFile()
    console.log(`✅ Added ${documents.length} documents to Simple Vector DB`)
  }

  async query(queryEmbedding: string | number[], nResults: number): Promise<RagResult> {
    if (this.documents.length === 0) {
      return { documents: [], ids: [], distances: [] }
    }

    // If queryEmbedding is a string, throw error as simple db doesn't handle embeddings
    if (typeof queryEmbedding === 'string') {
      throw new Error('SimpleVectorDatabase does not support text queries. Please provide vector embeddings.')
    }

    // Calculate cosine similarity for each document
    const similarities = this.documents.map(doc => {
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding)
      return {
        ...doc,
        similarity,
        distance: 1 - similarity // Convert similarity to distance
      }
    })

    // Sort by similarity (highest first) and take top N
    similarities.sort((a, b) => b.similarity - a.similarity)
    const topResults = similarities.slice(0, nResults)

    return {
      documents: topResults.map(r => r.text),
      ids: topResults.map(r => r.id),
      distances: topResults.map(r => r.distance)
    }
  }

  async getExistingIds(): Promise<string[]> {
    return this.documents.map(doc => doc.id)
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }

  private async saveToFile(): Promise<void> {
    const data = { documents: this.documents }
    fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2))
  }

  private embedQuery(query: string): number[] {
    // Implement your own query embedding logic here
    return Array.from({ length: 768 }, () => Math.random()) // Dummy implementation
  }
}

// Removed ChromaDB implementation as we're using Upstash as primary database

// Retry configuration
const RETRY_COUNT = 3
const RETRY_DELAY = 1000 // 1 second initial delay

// Helper for exponential backoff
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Upstash Vector implementation with retry logic
class UpstashDatabase implements VectorDatabase {
  private index: Index | null = null

  async initialize(): Promise<void> {
    try {
      if (!config.UPSTASH_VECTOR_REST_URL || !config.UPSTASH_VECTOR_REST_TOKEN) {
        throw new Error('Upstash Vector URL and TOKEN are required')
      }

      this.index = new Index({
        url: config.UPSTASH_VECTOR_REST_URL,
        token: config.UPSTASH_VECTOR_REST_TOKEN,
      })

      console.log('✅ Upstash Vector initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Upstash Vector:', error)
      throw error
    }
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        console.warn(`Attempt ${attempt} failed:`, error)
        
        if (attempt < RETRY_COUNT) {
          const delayTime = RETRY_DELAY * Math.pow(2, attempt - 1)
          console.log(`Retrying in ${delayTime}ms...`)
          await delay(delayTime)
        }
      }
    }
    
    throw new Error(`Operation failed after ${RETRY_COUNT} attempts. Last error: ${lastError?.message}`)
  }

  async addDocuments(documents: string[], embeddings: number[][], ids: string[]): Promise<void> {
    if (!this.index) {
      throw new Error('Upstash Vector not initialized')
    }

    const vectors = documents.map((text, i) => ({
      id: ids[i],
      // Use text-based insertion since we're using Upstash's built-in embedding
      data: text,
      metadata: {
        document: text,
        id: ids[i],
        // Parse food info from text
        type: text.toLowerCase().includes('fruit') ? 'Fruit' : undefined,
        color: text.toLowerCase().includes('yellow') ? 'yellow' : undefined,
        taste: text.toLowerCase().includes('sweet') ? 'sweet' : undefined,
        timestamp: new Date().toISOString()
      },
    }))

    await this.withRetry(async () => {
      await this.index!.upsert(vectors)
      console.log(`✅ Successfully added ${vectors.length} documents to Upstash`)
    })
  }

  async query(query: string | number[], nResults: number): Promise<RagResult> {
    if (!this.index) {
      throw new Error('Upstash Vector not initialized')
    }

    const results = await this.withRetry(async () => {
      // Enhanced query with metadata boost for better food matching
      const queryOptions = {
        topK: nResults * 2, // Get more results than needed for better filtering
        includeMetadata: true,
        ...(typeof query === 'string' 
          ? { 
              data: query,
              // Add query options to improve food matching
              queryOptions: {
                weightMultipliers: {
                  // Boost importance of matching attributes
                  dataPoints: 1.5,
                  metadata: 1.2
                }
              }
            } 
          : { vector: query }
        ),
      }

      const searchResults = await this.index!.query(queryOptions)

      // Filter and sort results based on relevance
      return searchResults
        .filter(r => {
          const metadata = r.metadata as { document: string }
          const text = metadata.document.toLowerCase()
          // For questions about attributes, check if the document mentions those attributes
          if (typeof query === 'string') {
            const q = query.toLowerCase()
            if (q.includes('yellow') && !text.includes('yellow')) return false
            if (q.includes('sweet') && !text.includes('sweet')) return false
            if (q.includes('fruit') && !text.includes('fruit')) return false
          }
          return true
        })
        .slice(0, nResults) // Take only the requested number of filtered results
    })

    return {
      documents: results.map(r => (r.metadata as { document?: string })?.document || ''),
      ids: results.map(r => String(r.id)),
      distances: results.map(r => 1 - (r.score || 0)), // Convert similarity score to distance
      metadatas: results.map(r => r.metadata as FoodMetadata),
    }
  }

  async getExistingIds(): Promise<string[]> {
    if (!this.index) {
      throw new Error('Upstash Vector not initialized')
    }

    try {
      const result = await this.withRetry(async () => {
        // Query with a random vector to get some results
        // This is a workaround since Upstash doesn't have a direct way to list all IDs
        const randomVector = Array.from({ length: 1024 }, () => Math.random())
        return await this.index!.query({
          vector: randomVector,
          topK: 1000, // Get as many as possible
          includeMetadata: false
        })
      })

      return result.map(r => String(r.id))
    } catch (error) {
      console.warn('⚠️ Could not fetch existing IDs from Upstash:', error)
      return []
    }
  }

  private embedQuery(query: string): number[] {
    // Implement your own query embedding logic here
    return Array.from({ length: 768 }, () => Math.random()) // Dummy implementation
  }
}

// Factory function to create the appropriate database
export function createVectorDatabase(): VectorDatabase {
  switch (config.VECTOR_DB_TYPE) {
    case 'upstash':
      return new UpstashDatabase()
    case 'simple':
    default:
      // Use simple vector database as fallback
      return new SimpleVectorDatabase()
  }
}
