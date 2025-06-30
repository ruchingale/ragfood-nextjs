'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Clock, Database, Hash, Target } from 'lucide-react'

interface RagDetails {
  documents: string[]
  ids: string[]
  similarities?: number[]
  processingTime: number
  resultCount: number
}

interface ResponseSectionProps {
  llmResponse?: string
  ragDetails?: RagDetails
  isLoading: boolean
  error?: string
}

export function ResponseSection({ llmResponse, ragDetails, isLoading, error }: ResponseSectionProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LLM Response Loading */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8">
              <div className="text-center space-y-2">
                <div className="animate-pulse">🤖</div>
                <p className="text-sm text-muted-foreground">Generating response...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RAG Details Loading */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              RAG Search Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8">
              <div className="text-center space-y-2">
                <div className="animate-pulse">🔍</div>
                <p className="text-sm text-muted-foreground">Searching database...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Bot className="h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!llmResponse && !ragDetails) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Ask a question to see the AI response and RAG search details</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LLM Response */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Response
          </CardTitle>
          <CardDescription>
            Generated answer based on retrieved context
          </CardDescription>
        </CardHeader>
        <CardContent>
          {llmResponse ? (
            <ScrollArea className="h-[400px]">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{llmResponse}</p>
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No response generated</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RAG Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            RAG Search Details
          </CardTitle>
          <CardDescription>
            Retrieved documents and similarity scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ragDetails ? (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {ragDetails.resultCount} results
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {ragDetails.processingTime}ms
                </Badge>
              </div>

              <Separator />

              {/* Retrieved Documents */}
              <ScrollArea className="h-[320px]">
                <div className="space-y-3">
                  {ragDetails.documents.map((doc, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Source {index + 1}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            ID: {ragDetails.ids[index]}
                          </Badge>
                        </div>
                        {ragDetails.similarities?.[index] !== undefined && (
                          <Badge 
                            variant="outline" 
                            className="flex items-center gap-1 text-xs"
                          >
                            <Target className="h-3 w-3" />
                            {Math.round(ragDetails.similarities[index] * 100)}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        &ldquo;{doc}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No search details available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Import needed for the placeholder state
import { MessageSquare } from 'lucide-react'
