import { config } from '../config'

// Abstract embedding interface
export interface EmbeddingProvider {
  getEmbedding(text: string): Promise<number[]>
}

// Ollama embedding implementation
class OllamaEmbedding implements EmbeddingProvider {
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${config.OLLAMA_BASE_URL}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.EMBED_MODEL,
          prompt: text,
        }),
      })

      if (!response.ok) {
        throw new Error(`Ollama embedding failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.embedding
    } catch (error) {
      console.error('❌ Failed to get Ollama embedding:', error)
      throw error
    }
  }
}

// Clarifai embedding implementation  
class ClarifaiEmbedding implements EmbeddingProvider {
  async getEmbedding(text: string): Promise<number[]> {
    try {
      if (!config.CLARIFAI_PAT || !config.CLARIFAI_MODEL_URL) {
        throw new Error('Clarifai PAT and MODEL_URL are required')
      }

      // Note: This is a placeholder implementation
      // The actual Clarifai SDK implementation would go here
      // For now, we'll use a simple fetch approach
      const response = await fetch('https://api.clarifai.com/v2/models/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${config.CLARIFAI_PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_url: config.CLARIFAI_MODEL_URL,
          inputs: [{
            data: {
              text: {
                raw: text
              }
            }
          }]
        }),
      })

      if (!response.ok) {
        throw new Error(`Clarifai embedding failed: ${response.statusText}`)
      }

      const data = await response.json()
      // Extract embedding from Clarifai response structure
      const embedding = data.outputs?.[0]?.data?.embeddings?.[0]?.vector
      
      if (!embedding) {
        throw new Error('Invalid Clarifai embedding response')
      }

      return embedding
    } catch (error) {
      console.error('❌ Failed to get Clarifai embedding:', error)
      throw error
    }
  }
}

// Factory function to create the appropriate embedding provider
export function createEmbeddingProvider(): EmbeddingProvider {
  switch (config.EMBEDDING_PROVIDER) {
    case 'ollama':
      return new OllamaEmbedding()
    case 'clarifai':
      return new ClarifaiEmbedding()
    default:
      throw new Error(`Unsupported embedding provider: ${config.EMBEDDING_PROVIDER}`)
  }
}
