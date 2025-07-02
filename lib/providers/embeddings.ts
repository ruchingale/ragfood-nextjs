// This file is now deprecated since Upstash Vector handles embeddings internally
// using the mixedbread-ai/mxbai-embed-large-v1 model

// Note: We keep this interface for type compatibility,
// but it's not actually used in the application anymore
export interface EmbeddingProvider {
  getEmbedding(text: string): Promise<number[]>
}

// Placeholder implementation that throws an error if accidentally used
class DeprecatedEmbeddingProvider implements EmbeddingProvider {
  async getEmbedding(): Promise<number[]> {
    throw new Error('External embedding providers are deprecated. Upstash Vector now handles embeddings internally.')
  }
}

export function createEmbeddingProvider(): EmbeddingProvider {
  return new DeprecatedEmbeddingProvider()
}
