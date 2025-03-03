'use client'

import type { MatchPrediction } from '@/types'
import { PredictionCard } from '@/components/prediction-card'
import { Card, CardContent } from '@/components/ui/card'
import { getLivePredictions } from '@/lib/api/prediction-api'
import { cn } from '@/lib/utils'
import {
  AlertCircleIcon,
  ArrowLeft,
  BadgePercentIcon,
  ChevronRightIcon,
  FilterIcon,
  HomeIcon,
  MapPinIcon,
  TargetIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// Type definitions for component props
interface StatsCardProps {
  label: string
  value: number
  icon: string
  color?: 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'purple'
}

interface PredictionSectionProps {
  title: string
  subtitle: string
  predictions: MatchPrediction[]
  viewAllLink?: string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'default'
}

// Main PredictionsPage component
export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<MatchPrediction[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch live predictions on mount and every 30 seconds
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const data = await getLivePredictions()
        setPredictions(data)
      }
      catch (error) {
        console.error('Failed to fetch predictions:', error)
      }
      finally {
        setLoading(false)
      }
    }
    fetchPredictions()
    const interval = setInterval(fetchPredictions, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="max-w-[90rem] mx-auto px-4 py-10 text-center text-muted-foreground">
        Loading predictions...
      </div>
    )
  }

  // Calculate stats for Quick Stats section
  const homeWins = predictions.filter(p => p.prediction.recommendedBet === 'Home Win').length
  const awayWins = predictions.filter(p => p.prediction.recommendedBet === 'Away Win').length
  const draws = predictions.filter(p => p.prediction.recommendedBet === 'Draw').length
  const goals = predictions.filter(p => p.prediction.recommendedBet === 'Over 2.5 Goals').length
  const noClear = predictions.filter(p => p.prediction.recommendedBet === 'No Clear Bet').length
  const highConfidence = predictions.filter(p => p.prediction.confidence > 0.75)

  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 md:px-8 pb-20">
      {/* Header */}
      <header className="py-6 md:py-8 flex flex-col space-y-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Predictions</h1>
            <p className="text-sm text-muted-foreground">Live football match insights</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 border-border/40">
          <div className="text-sm text-muted-foreground">
            {predictions.length}
            {' '}
            predictions •
            {predictions.filter(p => p.status.isLive).length}
            {' '}
            live
          </div>
          <button
            type="button"
            className="mt-2 sm:mt-0 flex items-center text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors gap-1"
            aria-label="Filter predictions"
          >
            <FilterIcon className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>
      </header>

      {/* Quick Stats */}
      <section className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-xl font-semibold tracking-tight mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatsCard label="Home Wins" value={homeWins} icon="home" color="blue" />
          <StatsCard label="Away Wins" value={awayWins} icon="away" color="green" />
          <StatsCard label="Draws" value={draws} icon="draw" color="purple" />
          <StatsCard label="Goal Markets" value={goals} icon="goal" color="orange" />
          <StatsCard label="No Clear Bet" value={noClear} icon="unclear" color="gray" />
        </div>
      </section>

      {/* Prediction Sections */}
      <div className="space-y-12">
        <PredictionSection
          title="High Confidence Picks"
          subtitle={`${highConfidence.length} predictions above 75% confidence`}
          icon={<BadgePercentIcon className="h-5 w-5 text-green-500" />}
          predictions={highConfidence.slice(0, 5)}
          viewAllLink="/predictions/high-confidence"
          color="green"
        />
        <PredictionSection
          title="Home Win Predictions"
          subtitle={`${homeWins} matches favoring the home team`}
          icon={<HomeIcon className="h-5 w-5 text-blue-500" />}
          predictions={predictions.filter(p => p.prediction.recommendedBet === 'Home Win').slice(0, 5)}
          viewAllLink="/predictions/home-wins"
          color="blue"
        />
        <PredictionSection
          title="Away Win Predictions"
          subtitle={`${awayWins} matches favoring the away team`}
          icon={<MapPinIcon className="h-5 w-5 text-green-500" />}
          predictions={predictions.filter(p => p.prediction.recommendedBet === 'Away Win').slice(0, 5)}
          viewAllLink="/predictions/away-wins"
          color="green"
        />
        <PredictionSection
          title="Goal Market Predictions"
          subtitle={`${goals} matches with goal opportunities`}
          icon={<TargetIcon className="h-5 w-5 text-orange-500" />}
          predictions={predictions.filter(p => p.prediction.recommendedBet === 'Over 2.5 Goals').slice(0, 5)}
          viewAllLink="/predictions/goals"
          color="orange"
        />
      </div>
    </div>
  )
}

// Stats Card Component
function StatsCard({ label, value, icon, color = 'blue' }: StatsCardProps) {
  const getIconComponent = () => {
    switch (icon) {
      case 'home':
        return <HomeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      case 'away':
        return <MapPinIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'draw':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-purple-600 dark:text-purple-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        )
      case 'goal':
        return <TargetIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      default:
        return <AlertCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20'
      case 'green':
        return 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20'
      case 'purple':
        return 'border-purple-200 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-900/20'
      case 'orange':
        return 'border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/20'
      default:
        return 'border-gray-200 dark:border-gray-800/50 bg-gray-50 dark:bg-gray-800/20'
    }
  }

  return (
    <Card
      className={cn(
        'transition-all duration-300 hover:shadow-md hover:-translate-y-1 border rounded-lg',
        getColorClasses(),
      )}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-opacity-50 flex items-center justify-center">
          {getIconComponent()}
        </div>
        <div>
          <div className="text-xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// Prediction Section Component
function PredictionSection({
  title,
  subtitle,
  predictions,
  viewAllLink,
  icon,
  color = 'default',
}: PredictionSectionProps) {
  const getSectionBackgroundClasses = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-900/20'
      case 'green':
        return 'bg-green-50 dark:bg-green-900/20'
      case 'orange':
        return 'bg-orange-50 dark:bg-orange-900/20'
      case 'purple':
        return 'bg-purple-50 dark:bg-purple-900/20'
      default:
        return 'bg-gray-50 dark:bg-gray-800/20'
    }
  }

  const getTextColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'text-blue-600 dark:text-blue-400'
      case 'green':
        return 'text-green-600 dark:text-green-400'
      case 'orange':
        return 'text-orange-600 dark:text-orange-400'
      case 'purple':
        return 'text-purple-600 dark:text-purple-400'
      default:
        return 'text-primary'
    }
  }

  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={cn('p-4 rounded-t-lg', getSectionBackgroundClasses())}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {icon}
              <h2 className={cn('text-xl font-semibold tracking-tight', getTextColorClasses())}>{title}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Link
            href={viewAllLink || '/predictions'}
            className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center group"
          >
            View all
            <ChevronRightIcon className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {predictions.map(prediction => (
          <div
            key={prediction.fixtureId}
            className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <PredictionCard data={prediction} />
          </div>
        ))}
        {predictions.length === 0 && (
          <div className="col-span-full text-center py-10 bg-muted/50 rounded-lg border border-border/40">
            <p className="text-muted-foreground">No predictions available</p>
          </div>
        )}
      </div>
    </section>
  )
}
