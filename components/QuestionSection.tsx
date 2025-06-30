'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Loader2 } from 'lucide-react'

interface QuestionSectionProps {
  onSubmit: (question: string) => Promise<void>
  isLoading: boolean
}

const EXAMPLE_QUESTIONS = [
  "What fruits are yellow and sweet?",
  "Tell me about spicy foods",
  "What foods are popular in tropical regions?",
  "What are some types of fruit?",
  "Which foods are red and spicy?",
]

export function QuestionSection({ onSubmit, isLoading }: QuestionSectionProps) {
  const [question, setQuestion] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async () => {
    if (!question.trim()) return
    
    startTransition(async () => {
      await onSubmit(question.trim())
    })
  }

  const handleExampleClick = (exampleQuestion: string) => {
    setQuestion(exampleQuestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const isSubmitDisabled = !question.trim() || isLoading || isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Ask a Question
        </CardTitle>
        <CardDescription>
          Ask questions about food items in the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question Input */}
        <div className="space-y-2">
          <Label htmlFor="question">Your Question</Label>
          <Textarea
            id="question"
            placeholder="Ask anything about food items, their types, regions, flavors..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="resize-none"
          />
          <div className="text-xs text-muted-foreground">
            Press Ctrl+Enter to submit
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitDisabled}
          className="w-full"
          size="lg"
        >
          {(isLoading || isPending) ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Ask Question
        </Button>

        {/* Example Questions */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Example Questions:</Label>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((example, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleExampleClick(example)}
              >
                {example}
              </Badge>
            ))}
          </div>
        </div>

        {/* Status */}
        {(isLoading || isPending) && (
          <div className="p-3 bg-muted rounded-lg text-sm text-center">
            🧠 Processing your question...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
