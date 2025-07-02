'use server'

import { createVectorDatabase } from '@/lib/providers/database'
import { createEmbeddingProvider } from '@/lib/providers/embeddings'
import { loadFoodsData } from './data-actions'
import { EmbedRequestSchema, type EmbeddingResult } from '@/lib/types'

// Global provider instances (singleton pattern)
let dbInstance: ReturnType<typeof createVectorDatabase> | null = null
let embeddingInstance: ReturnType<typeof createEmbeddingProvider> | null = null
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
    
    return { db: dbInstance, embedding: embeddingInstance }
  } catch (error) {
    console.error('❌ Failed to initialize providers:', error)
    // Reset instances on failure so they can be retried
    dbInstance = null
    embeddingInstance = null
    isInitialized = false
    throw error
  }
}

// Embed all food data
export async function embedFoodsData(request: unknown): Promise<EmbeddingResult> {
  try {
    // Validate request
    const { force } = EmbedRequestSchema.parse(request)
    
    const { db } = await initializeProviders()
    
    // Load food data
    const foods = await loadFoodsData()
    console.log(`📚 Processing ${foods.length} food items...`)
    
    // Get existing IDs to avoid re-embedding
    let existingIds: string[] = []
    if (!force) {
      try {
        existingIds = await db.getExistingIds()
        console.log(`✅ Found ${existingIds.length} existing embeddings`)
      } catch (error) {
        console.warn('⚠️ Could not get existing IDs, will embed all items:', error)
      }
    }
    
    // Filter new items
    const newItems = force ? foods : foods.filter(item => !existingIds.includes(item.id))
    
    if (newItems.length === 0) {
      return {
        success: true,
        message: '✅ All food items are already embedded',
        count: existingIds.length,
      }
    }
    
    console.log(`🆕 Embedding ${newItems.length} new items...`)
    
    // Process items in batches to avoid overwhelming the service
    const batchSize = 5
    let processed = 0
    
    for (let i = 0; i < newItems.length; i += batchSize) {
      const batch = newItems.slice(i, i + batchSize)
      
      // Prepare documents for batch
      const documents: string[] = []
      const embeddings: number[][] = []
      const ids: string[] = []
      
      for (const item of batch) {
        try {
          // Enhance text with region/type information
          let enrichedText = item.text
          if (item.region) {
            enrichedText += ` This food is popular in ${item.region}.`
          }
          if (item.type) {
            enrichedText += ` It is a type of ${item.type}.`
          }
          
          // Let Upstash handle the embedding
          documents.push(enrichedText)
          embeddings.push([]) // Empty array since Upstash will generate embeddings
          ids.push(item.id)
          
          processed++
          console.log(`📝 Processed ${processed}/${newItems.length}: ${item.id}`)
          
        } catch (error) {
          console.error(`❌ Failed to process item ${item.id}:`, error)
          // Continue with other items
        }
      }
      
      // Add batch to database
      if (documents.length > 0) {
        await db.addDocuments(documents, embeddings, ids)
        console.log(`💾 Saved batch of ${documents.length} embeddings`)
      }
    }
    
    return {
      success: true,
      message: `✅ Successfully embedded ${processed} food items`,
      count: processed,
    }
    
  } catch (error) {
    console.error('❌ Failed to embed foods data:', error)
    return {
      success: false,
      message: 'Failed to embed foods data',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Get embedding status
export async function getEmbeddingStatus() {
  try {
    console.log('📊 Getting embedding status...')
    const { db } = await initializeProviders()
    const foods = await loadFoodsData()
    
    let existingIds: string[] = []
    try {
      existingIds = await db.getExistingIds()
      console.log(`✅ Found ${existingIds.length} existing embeddings`)
    } catch (error) {
      console.warn('⚠️ Could not get existing IDs (database might be empty):', error)
      // This is okay - it just means no embeddings exist yet
      existingIds = []
    }
    
    return {
      success: true,
      total: foods.length,
      embedded: existingIds.length,
      remaining: foods.length - existingIds.length,
      percentage: Math.round((existingIds.length / foods.length) * 100),
    }
  } catch (error) {
    console.error('❌ Failed to get embedding status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get embedding status',
    }
  }
}
