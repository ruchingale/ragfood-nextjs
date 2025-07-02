'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react'
import { embedFoodsData, getEmbeddingStatus } from '@/app/actions/embedding-actions'
import { getFoodStats } from '@/app/actions/data-actions'

interface EmbeddingStatus {
  success: boolean
  total?: number
  embedded?: number
  remaining?: number
  percentage?: number
  error?: string
}

interface FoodStats {
  success: boolean
  stats?: {
    total: number
    regions: number
    types: number
    withRegion: number
    withType: number
  }
  error?: string
}

export function EmbeddingSection() {
  const [status, setStatus] = useState<EmbeddingStatus | null>(null)
  const [stats, setStats] = useState<FoodStats | null>(null)
  const [isPending, startTransition] = useTransition()
  const [lastResult, setLastResult] = useState<string>('')

  // Load initial status
  const loadStatus = async () => {
    const [statusResult, statsResult] = await Promise.all([
      getEmbeddingStatus(),
      getFoodStats()
    ])
    setStatus(statusResult)
    setStats(statsResult)
  }

  // Handle embedding process
  const handleEmbed = async (force: boolean = false) => {
    startTransition(async () => {
      try {
        const result = await embedFoodsData({ force })
        setLastResult(result.message || 'Embedding completed')
        
        // Refresh status after embedding
        await loadStatus()
      } catch (error) {
        setLastResult('Failed to embed data: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    })
  }

  // Load status on component mount
  useEffect(() => {
    loadStatus()
  }, [])

  const getStatusColor = () => {
    if (!status?.success) return 'destructive'
    if (status.percentage === 100) return 'default'
    if ((status.percentage || 0) > 50) return 'secondary'
    return 'outline'
  }

  const getStatusIcon = () => {
    if (!status?.success) return <AlertCircle className="h-4 w-4" />
    if (status.percentage === 100) return <CheckCircle className="h-4 w-4" />
    return <Database className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sync to Upstash
        </CardTitle>
        <CardDescription>
          Manage food data in Upstash Vector database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        {status && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-medium">
                  {status.success ? `${status.embedded}/${status.total} embedded` : 'Status unknown'}
                </span>
              </div>
              <Badge variant={getStatusColor()}>
                {status.success ? `${status.percentage}%` : 'Error'}
              </Badge>
            </div>
            
            {status.success && (
              <Progress value={status.percentage} className="w-full" />
            )}
          </div>
        )}

        {/* Food Statistics */}
        {stats?.success && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Total Items: <span className="font-medium">{stats.stats?.total}</span></div>
            <div>Regions: <span className="font-medium">{stats.stats?.regions}</span></div>
            <div>Types: <span className="font-medium">{stats.stats?.types}</span></div>
            <div>Complete: <span className="font-medium">{stats.stats?.withRegion}</span></div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={() => handleEmbed(false)} 
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {status?.remaining === 0 ? 'Re-sync All' : 'Sync New Items'}
          </Button>
          
          <Button              variant="outline" 
              onClick={() => handleEmbed(true)} 
              disabled={isPending}
            >
              Force Re-sync
          </Button>
        </div>

        {/* Last Result */}
        {lastResult && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            {lastResult}
          </div>
        )}

        {/* Refresh Status */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadStatus}
          className="w-full"
        >
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  )
}
