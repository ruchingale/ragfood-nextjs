import Groq from 'groq-sdk'
import { config } from '../config'
import { LlmResponse } from '../types'

// Abstract LLM interface
export interface LlmProvider {
  generateResponse(prompt: string): Promise<LlmResponse>
}

// Ollama LLM implementation
class OllamaLlm implements LlmProvider {
  async generateResponse(prompt: string): Promise<LlmResponse> {
    try {
      const startTime = Date.now()
      
      const response = await fetch(`${config.OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.LLM_MODEL,
          prompt,
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error(`Ollama LLM failed: ${response.statusText}`)
      }

      const data = await response.json()
      const processingTime = Date.now() - startTime

      return {
        response: data.response?.trim() || '',
        processingTime,
      }
    } catch (error) {
      console.error('❌ Failed to get Ollama response:', error)
      throw error
    }
  }
}

// Groq LLM implementation
class GroqLlm implements LlmProvider {
  private client: Groq

  constructor() {
    if (!config.GROQ_API_KEY) {
      throw new Error('Groq API key is required')
    }
    
    this.client = new Groq({
      apiKey: config.GROQ_API_KEY,
    })
  }

  async generateResponse(prompt: string): Promise<LlmResponse> {
    try {
      const startTime = Date.now()
      
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: config.GROQ_MODEL,
        temperature: 0.1,
        max_tokens: 1000,
      })

      const processingTime = Date.now() - startTime

      return {
        response: completion.choices[0]?.message?.content?.trim() || '',
        processingTime,
      }
    } catch (error) {
      console.error('❌ Failed to get Groq response:', error)
      throw error
    }
  }
}

// Factory function to create the appropriate LLM provider
export function createLlmProvider(): LlmProvider {
  switch (config.LLM_PROVIDER) {
    case 'ollama':
      return new OllamaLlm()
    case 'groq':
      return new GroqLlm()
    default:
      throw new Error(`Unsupported LLM provider: ${config.LLM_PROVIDER}`)
  }
}
