'use client'

import { useState } from 'react'
import { EmbeddingSection } from '@/components/EmbeddingSection'
import { QuestionSection } from '@/components/QuestionSection'
import { ProgressiveResponseSection } from '@/components/ProgressiveResponseSection'
import { getRagSearchResults, getLlmResponse } from '@/app/actions/query-actions'
import type { RagDetails } from '@/lib/types'

interface ProgressiveQueryState {
  question: string
  ragDetails?: RagDetails
  llmResponse?: string
  isSearching: boolean
  isGenerating: boolean
  error?: string
}

export default function Home() {
  const [queryState, setQueryState] = useState<ProgressiveQueryState>({
    question: '',
    isSearching: false,
    isGenerating: false,
  })

  const handleQuestionSubmit = async (question: string) => {
    // Reset state for new question
    setQueryState({
      question,
      isSearching: true,
      isGenerating: false,
    })

    try {
      // Step 1: Get RAG search results first
      console.log('🔍 Starting RAG search...')
      const ragResult = await getRagSearchResults({ question })
      
      if (!ragResult.success) {
        setQueryState(prev => ({
          ...prev,
          isSearching: false,
          error: ragResult.error,
        }))
        return
      }

      // Show RAG results immediately
      setQueryState(prev => ({
        ...prev,
        isSearching: false,
        isGenerating: true,
        ragDetails: ragResult.ragDetails,
      }))

      // Step 2: Generate LLM response using the retrieved context
      console.log('🤖 Starting LLM response generation...')
      const context = ragResult.ragDetails!.documents.join('\n')
      const llmResult = await getLlmResponse(question, context)
      
      if (!llmResult.success) {
        setQueryState(prev => ({
          ...prev,
          isGenerating: false,
          error: llmResult.error,
        }))
        return
      }

      // Show final LLM response
      setQueryState(prev => ({
        ...prev,
        isGenerating: false,
        llmResponse: llmResult.response,
      }))

    } catch (error) {
      console.error('❌ Question processing failed:', error)
      setQueryState(prev => ({
        ...prev,
        isSearching: false,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }))
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          🍽️ Food RAG System
        </h1>
        <p className="text-lg text-muted-foreground">
          Ask questions about food items using Retrieval-Augmented Generation
        </p>
      </div>

      {/* Embedding Section */}
      <EmbeddingSection />

      {/* Question Input */}
      <QuestionSection 
        onSubmit={handleQuestionSubmit}
        isLoading={queryState.isSearching || queryState.isGenerating}
      />

      {/* Progressive Response Display */}
      <ProgressiveResponseSection 
        question={queryState.question}
        ragDetails={queryState.ragDetails}
        llmResponse={queryState.llmResponse}
        isSearching={queryState.isSearching}
        isGenerating={queryState.isGenerating}
        error={queryState.error}
      />
    </div>
  )
}
