import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines multiple class values into a single className string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format odds value to display with appropriate color
 */
export function formatOdds(value: number): { value: string, color: string } {
  // Format the value to 2 decimal places
  const formattedValue = value.toFixed(2)

  // Determine the color based on odds value
  let color = 'text-card-foreground'

  if (value < 1.5) {
    color = 'text-destructive' // Very low odds = high probability
  }
  else if (value < 2.0) {
    color = 'text-destructive/80' // Low odds
  }
  else if (value < 3.0) {
    color = 'text-accent-foreground' // Medium odds
  }
  else if (value < 5.0) {
    color = 'text-soccer-green' // High odds
  }
  else {
    color = 'text-primary' // Very high odds = low probability
  }

  return { value: formattedValue, color }
}

/**
 * Format prediction confidence as a percentage with an appropriate color
 */
export function formatConfidence(value: number): { value: string, color: string } {
  // Convert to percentage and format
  const percentage = Math.round(value * 100)

  // Determine the color based on confidence level
  let color = 'text-card-foreground'

  if (percentage >= 80) {
    color = 'text-soccer-green' // Very high confidence
  }
  else if (percentage >= 65) {
    color = 'text-soccer-green/80' // High confidence
  }
  else if (percentage >= 50) {
    color = 'text-accent-foreground' // Medium confidence
  }
  else if (percentage >= 35) {
    color = 'text-destructive/80' // Low confidence
  }
  else {
    color = 'text-destructive' // Very low confidence
  }

  return { value: `${percentage}%`, color }
}

/**
 * Format score with appropriate color based on goals
 */
export function formatScore(homeScore: number, awayScore: number): { homeColor: string, awayColor: string } {
  const homeColor = homeScore > awayScore ? 'text-score-home' : homeScore < awayScore ? 'text-muted-foreground' : 'text-score-draw'
  const awayColor = awayScore > homeScore ? 'text-score-away' : awayScore < homeScore ? 'text-muted-foreground' : 'text-score-draw'

  return { homeColor, awayColor }
}
