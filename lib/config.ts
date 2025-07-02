import { z } from 'zod'

// Environment variable schema
const envSchema = z.object({
  // Database configuration (Upstash primary, simple fallback)
  VECTOR_DB_TYPE: z.enum(['upstash', 'simple']).default('upstash'),
  UPSTASH_VECTOR_REST_URL: z.string().optional(),
  UPSTASH_VECTOR_REST_TOKEN: z.string().optional(),

  // LLM Provider configuration
  LLM_PROVIDER: z.enum(['ollama', 'groq']).default('ollama'),
  
  // Ollama configuration (for LLM only)
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  LLM_MODEL: z.string().default('llama3.2'),

  // Groq configuration
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('llama-3.2-3b-preview'),
})

// Validate and export environment variables
function validateEnv() {
  try {
    return envSchema.parse({
      VECTOR_DB_TYPE: process.env.VECTOR_DB_TYPE,
      UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
      UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN,
      LLM_PROVIDER: process.env.LLM_PROVIDER,
      OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
      LLM_MODEL: process.env.LLM_MODEL,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      GROQ_MODEL: process.env.GROQ_MODEL,
    })
  } catch (error) {
    console.error('❌ Invalid environment configuration:', error)
    throw new Error('Invalid environment configuration')
  }
}

export const config = validateEnv()

// Constants
export const COLLECTION_NAME = 'foods'
export const DEFAULT_RAG_RESULTS = 3

// Helper to check if we're in development
export const isDevelopment = process.env.NODE_ENV === 'development'

// Log current configuration in development
if (isDevelopment) {
  console.log('🔧 Configuration loaded:', {
    vectorDb: config.VECTOR_DB_TYPE,
    llmProvider: config.LLM_PROVIDER,
  })
}
