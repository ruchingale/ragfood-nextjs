'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Clock, Database, Hash, Target, Search, MessageSquare, Loader2 } from 'lucide-react'

interface RagDetails {
  documents: string[]
  ids: string[]
  similarities?: number[]
  processingTime: number
  resultCount: number
}

interface ProgressiveResponseSectionProps {
  question: string
  ragDetails?: RagDetails
  llmResponse?: string
  isSearching: boolean
  isGenerating: boolean
  error?: string
}

export function ProgressiveResponseSection({ 
  question,
  ragDetails, 
  llmResponse, 
  isSearching, 
  isGenerating, 
  error 
}: ProgressiveResponseSectionProps) {
  // Show placeholder when no question has been asked and no activity
  if (!question && !isSearching && !isGenerating) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Ask a Question</h3>
        <p>Submit a question above to see RAG search results and AI responses</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <MessageSquare className="h-5 w-5" />
            Error Processing Question
          </CardTitle>
          <CardDescription>
            Question: &ldquo;{question}&rdquo;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Question Display - Show whenever there's a question */}
      {question && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              Your Question
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground italic">&ldquo;{question}&rdquo;</p>
          </CardContent>
        </Card>
      )}

      {/* Two-column layout for results - Show when there's a question */}
      {question && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RAG Search Results (Left Column) - Shows First */}
        <Card className={ragDetails ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              RAG Search Results
              {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
              {ragDetails && !isSearching && <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Complete</Badge>}
            </CardTitle>
            <CardDescription>
              {isSearching 
                ? "Searching the database for relevant information..." 
                : ragDetails 
                  ? "Retrieved documents and similarity scores"
                  : "Waiting to search database..."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSearching ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center space-y-3">
                  <Search className="h-8 w-8 mx-auto animate-pulse text-blue-600" />
                  <p className="text-sm text-muted-foreground">Searching for relevant documents...</p>
                  <div className="flex justify-center">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : ragDetails ? (
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
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {ragDetails.documents.map((doc, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2 bg-white dark:bg-gray-800">
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
                <p>Search will begin once you submit a question</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Response (Right Column) - Shows After RAG Results */}
        <Card className={llmResponse ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Response
              {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
              {llmResponse && !isGenerating && <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Complete</Badge>}
            </CardTitle>
            <CardDescription>
              {isGenerating 
                ? "Generating AI response based on retrieved context..." 
                : llmResponse 
                  ? "AI-generated answer using retrieved information"
                  : ragDetails 
                    ? "Ready to generate response..."
                    : "Waiting for search results..."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center space-y-3">
                  <Bot className="h-8 w-8 mx-auto animate-pulse text-green-600" />
                  <p className="text-sm text-muted-foreground">AI is thinking and generating response...</p>
                  <div className="flex justify-center">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 bg-green-600 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : llmResponse ? (
              <ScrollArea className="h-[400px]">
                <div className="prose prose-sm max-w-none p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <p className="whitespace-pre-wrap m-0">{llmResponse}</p>
                </div>
              </ScrollArea>
            ) : ragDetails ? (
              <div className="text-center p-8 text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>AI response will be generated using the search results above</p>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>AI response will appear after database search</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  )
}
