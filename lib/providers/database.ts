import { Index } from '@upstash/vector'
import { config, COLLECTION_NAME } from '../config'
import { RagResult, FoodMetadata } from '../types'
import * as fs from 'fs'
import * as path from 'path'

// Abstract database interface
export interface VectorDatabase {
  initialize(): Promise<void>
  addDocuments(documents: string[], embeddings: number[][], ids: string[]): Promise<void>
  query(queryEmbedding: number[], nResults: number): Promise<RagResult>
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

  async query(queryEmbedding: number[], nResults: number): Promise<RagResult> {
    if (this.documents.length === 0) {
      return { documents: [], ids: [], distances: [] }
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
}

// ChromaDB client and collection types
interface ChromaClient {
  getOrCreateCollection(config: {
    name: string
    embeddingFunction?: {
      generate: (texts: string[]) => Promise<number[][]>
    }
  }): Promise<ChromaCollection>
}

interface ChromaCollection {
  add(data: {
    documents: string[]
    embeddings: number[][]
    ids: string[]
  }): Promise<void>
  query(params: {
    queryEmbeddings: number[][]
    nResults: number
  }): Promise<{
    documents: (string | null)[][]
    ids: (string | null)[][]
    distances?: (number | null)[][]
    metadatas?: unknown[][]
  }>
  get(): Promise<{
    ids: (string | null)[]
  }>
}

// ChromaDB implementation (requires ChromaDB server running)
class ChromaDatabase implements VectorDatabase {
  private client: ChromaClient | null = null
  private collection: ChromaCollection | null = null

  async initialize(): Promise<void> {
    try {
      const { ChromaClient } = await import('chromadb')
      
      // Create ChromaClient (requires ChromaDB server running on localhost:8000)
      this.client = new ChromaClient({
        path: "http://localhost:8000"
      })
      
      // Create a custom embedding function that will be a no-op
      // since we handle embeddings externally
      const customEmbeddingFunction = {
        generate: async (texts: string[]) => {
          // Return dummy embeddings - we'll provide real embeddings when adding documents
          return texts.map(() => new Array(1024).fill(0)) // Use 1024 to match mxbai-embed-large
        }
      }
      
      // Create collection with custom embedding function
      this.collection = await this.client.getOrCreateCollection({
        name: COLLECTION_NAME,
        embeddingFunction: customEmbeddingFunction,
      })
      
      console.log('✅ ChromaDB initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize ChromaDB:', error)
      throw new Error(`ChromaDB initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async addDocuments(documents: string[], embeddings: number[][], ids: string[]): Promise<void> {
    if (!this.collection) {
      throw new Error('ChromaDB not initialized')
    }

    await this.collection.add({
      documents,
      embeddings,
      ids,
    })
  }

  async query(queryEmbedding: number[], nResults: number): Promise<RagResult> {
    if (!this.collection) {
      throw new Error('ChromaDB not initialized')
    }

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults,
    })

    // Type-safe handling of metadata
    const safeMetadatas = results.metadatas?.[0]?.map(metadata => {
      if (metadata === null || metadata === undefined) return null
      if (typeof metadata === 'object' && metadata !== null) {
        return metadata as FoodMetadata
      }
      return null
    })

    return {
      documents: (results.documents[0] || []).filter((doc: string | null): doc is string => doc !== null),
      ids: (results.ids[0] || []).filter((id: string | null): id is string => id !== null),
      distances: results.distances?.[0]?.filter((dist: number | null): dist is number => dist !== null),
      metadatas: safeMetadatas,
    }
  }

  async getExistingIds(): Promise<string[]> {
    if (!this.collection) {
      throw new Error('ChromaDB not initialized')
    }

    const results = await this.collection.get()
    return (results.ids || []).filter((id: string | null): id is string => id !== null)
  }
}

// Upstash Vector implementation
class UpstashDatabase implements VectorDatabase {
  private index: Index | null = null

  async initialize(): Promise<void> {
    try {
      if (!config.UPSTASH_VECTOR_URL || !config.UPSTASH_VECTOR_TOKEN) {
        throw new Error('Upstash Vector URL and TOKEN are required')
      }

      this.index = new Index({
        url: config.UPSTASH_VECTOR_URL,
        token: config.UPSTASH_VECTOR_TOKEN,
      })

      console.log('✅ Upstash Vector initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Upstash Vector:', error)
      throw error
    }
  }

  async addDocuments(documents: string[], embeddings: number[][], ids: string[]): Promise<void> {
    if (!this.index) {
      throw new Error('Upstash Vector not initialized')
    }

    const vectors = embeddings.map((embedding, i) => ({
      id: ids[i],
      vector: embedding,
      metadata: { document: documents[i] },
    }))

    await this.index.upsert(vectors)
  }

  async query(queryEmbedding: number[], nResults: number): Promise<RagResult> {
    if (!this.index) {
      throw new Error('Upstash Vector not initialized')
    }

    const results = await this.index.query({
      vector: queryEmbedding,
      topK: nResults,
      includeMetadata: true,
    })

    return {
      documents: results.map(r => (r.metadata as { document?: string })?.document || ''),
      ids: results.map(r => String(r.id)),
      distances: results.map(r => 1 - (r.score || 0)), // Convert score to distance
    }
  }

  async getExistingIds(): Promise<string[]> {
    if (!this.index) {
      throw new Error('Upstash Vector not initialized')
    }

    // Note: Upstash Vector doesn't have a direct way to get all IDs
    // This is a limitation we'll need to work around
    console.warn('⚠️ Upstash Vector: Cannot efficiently get existing IDs')
    return []
  }
}

// Factory function to create the appropriate database
export function createVectorDatabase(): VectorDatabase {
  switch (config.VECTOR_DB_TYPE) {
    case 'chroma':
      return new ChromaDatabase()
    case 'upstash':
      return new UpstashDatabase()
    case 'simple':
    default:
      // Use simple vector database for local development by default
      return new SimpleVectorDatabase()
  }
}
