// src/app/(predictions)/page.tsx

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

// Type definitions for the component props
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

export default async function PredictionsPage() {
  // Pre-fetch predictions for server rendering
  const predictions = await getLivePredictions()

  // Count stats by prediction types
  const homeWins = predictions.filter(p => p.prediction.recommendedBet === 'Home Win').length
  const awayWins = predictions.filter(p => p.prediction.recommendedBet === 'Away Win').length
  const draws = predictions.filter(p => p.prediction.recommendedBet === 'Draw').length
  const goals = predictions.filter(p => p.prediction.recommendedBet === 'Over 2.5 Goals').length
  const noClear = predictions.filter(p => p.prediction.recommendedBet === 'No Clear Bet').length

  // Get high confidence predictions (>75%)
  const highConfidence = predictions.filter(p => p.prediction.confidence > 0.75)

  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 md:px-8 pb-20">
      <header className="py-6 md:py-10 flex flex-col space-y-3">
        <div className="flex items-center">
          <Link href="/" className="mr-3 p-2 hover:bg-muted rounded-full transition-colors duration-200">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Predictions</h1>
            <p className="text-muted-foreground text-sm">Advanced analysis and insights across all matches</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-b pb-2 border-border/40">
          <div className="text-sm text-muted-foreground">
            {predictions.length}
            {' '}
            predictions available •
            {predictions.filter(p => p.status.isLive).length}
            {' '}
            live matches
          </div>
          <button type="button" className="flex items-center text-sm p-2 rounded-md hover:bg-muted transition-colors gap-1">
            <FilterIcon className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-xl font-semibold tracking-tight mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <StatsCard label="Home Wins" value={homeWins} icon="home" color="blue" />
          <StatsCard label="Away Wins" value={awayWins} icon="away" color="green" />
          <StatsCard label="Draws" value={draws} icon="draw" color="purple" />
          <StatsCard label="Goal Markets" value={goals} icon="goal" color="orange" />
          <StatsCard label="No Clear Bet" value={noClear} icon="unclear" color="gray" />
        </div>
      </section>

      {/* Prediction Sections */}
      <div className="space-y-10">
        {/* High Confidence Section */}
        <PredictionSection
          title="High Confidence Picks"
          subtitle={`${highConfidence.length} predictions with confidence level above 75%`}
          icon={<BadgePercentIcon className="h-5 w-5 text-green-500" />}
          predictions={highConfidence.slice(0, 5)}
          viewAllLink="/predictions/high-confidence"
          color="green"
        />

        {/* Home Win Section */}
        <PredictionSection
          title="Home Win Predictions"
          subtitle={`${homeWins} matches favoring the home team`}
          icon={<HomeIcon className="h-5 w-5 text-blue-500" />}
          predictions={predictions.filter(p => p.prediction.recommendedBet === 'Home Win').slice(0, 5)}
          viewAllLink="/predictions/home-wins"
          color="blue"
        />

        {/* Away Win Section */}
        <PredictionSection
          title="Away Win Predictions"
          subtitle={`${awayWins} matches favoring the away team`}
          icon={<MapPinIcon className="h-5 w-5 text-green-500" />}
          predictions={predictions.filter(p => p.prediction.recommendedBet === 'Away Win').slice(0, 5)}
          viewAllLink="/predictions/away-wins"
          color="green"
        />

        {/* Goal Markets Section */}
        <PredictionSection
          title="Goal Market Predictions"
          subtitle={`${goals} matches with goal market opportunities`}
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
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <HomeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        )
      case 'away':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <MapPinIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        )
      case 'draw':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        )
      case 'goal':
        return (
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <TargetIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center">
            <AlertCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
        )
    }
  }

  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'border-blue-200 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 to-blue-100/80 dark:from-blue-950/40 dark:to-blue-900/20 hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20'
      case 'green':
        return 'border-green-200 dark:border-green-900/30 bg-gradient-to-br from-green-50 to-green-100/80 dark:from-green-950/40 dark:to-green-900/20 hover:shadow-green-100/50 dark:hover:shadow-green-900/20'
      case 'purple':
        return 'border-purple-200 dark:border-purple-900/30 bg-gradient-to-br from-purple-50 to-purple-100/80 dark:from-purple-950/40 dark:to-purple-900/20 hover:shadow-purple-100/50 dark:hover:shadow-purple-900/20'
      case 'orange':
        return 'border-orange-200 dark:border-orange-900/30 bg-gradient-to-br from-orange-50 to-orange-100/80 dark:from-orange-950/40 dark:to-orange-900/20 hover:shadow-orange-100/50 dark:hover:shadow-orange-900/20'
      default:
        return 'border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100/80 dark:from-gray-900/60 dark:to-gray-800/40 hover:shadow-gray-100/50 dark:hover:shadow-gray-900/20'
    }
  }

  return (
    <Card className={`h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${getColorClasses()}`}>
      <CardContent className="p-4 flex items-center">
        {getIconComponent()}
        <div className="ml-4">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground font-medium">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// Prediction Section Component
function PredictionSection({ title, subtitle, predictions, viewAllLink, icon, color = 'default' }: PredictionSectionProps) {
  const getSectionColorClasses = () => {
    switch (color) {
      case 'blue': return 'border-l-4 border-blue-500 dark:border-blue-400 pl-4'
      case 'green': return 'border-l-4 border-green-500 dark:border-green-400 pl-4'
      case 'orange': return 'border-l-4 border-orange-500 dark:border-orange-400 pl-4'
      case 'purple': return 'border-l-4 border-purple-500 dark:border-purple-400 pl-4'
      default: return 'border-l-4 border-primary pl-4'
    }
  }

  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
      <div className="flex items-center justify-between">
        <div className={cn('space-y-1', getSectionColorClasses())}>
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        {predictions.map(prediction => (
          <div
            key={prediction.fixtureId}
            className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <PredictionCard data={prediction} variant="compact" />
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
