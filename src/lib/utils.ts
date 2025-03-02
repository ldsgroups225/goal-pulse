import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class values into a single className string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format odds value to display with appropriate color
 */
export function formatOdds(value: number): { value: string; color: string } {
  // Format the value to 2 decimal places
  const formattedValue = value.toFixed(2);
  
  // Determine the color based on odds value
  let color = 'text-gray-700';
  
  if (value < 1.5) {
    color = 'text-red-600'; // Very low odds = high probability
  } else if (value < 2.0) {
    color = 'text-orange-600'; // Low odds
  } else if (value < 3.0) {
    color = 'text-amber-600'; // Medium odds
  } else if (value < 5.0) {
    color = 'text-green-600'; // High odds
  } else {
    color = 'text-blue-600'; // Very high odds = low probability
  }
  
  return { value: formattedValue, color };
}

/**
 * Format prediction confidence as a percentage with an appropriate color
 */
export function formatConfidence(value: number): { value: string; color: string } {
  // Convert to percentage and format
  const percentage = Math.round(value * 100);
  
  // Determine the color based on confidence level
  let color = 'text-gray-700';
  
  if (percentage >= 80) {
    color = 'text-green-600'; // Very high confidence
  } else if (percentage >= 65) {
    color = 'text-emerald-600'; // High confidence
  } else if (percentage >= 50) {
    color = 'text-amber-600'; // Medium confidence
  } else if (percentage >= 35) {
    color = 'text-orange-600'; // Low confidence
  } else {
    color = 'text-red-600'; // Very low confidence
  }
  
  return { value: `${percentage}%`, color };
}

/**
 * Format score with appropriate color based on goals
 */
export function formatScore(homeScore: number, awayScore: number): { homeColor: string; awayColor: string } {
  const homeColor = homeScore > awayScore ? 'text-green-600' : homeScore < awayScore ? 'text-gray-600' : 'text-gray-800';
  const awayColor = awayScore > homeScore ? 'text-green-600' : awayScore < homeScore ? 'text-gray-600' : 'text-gray-800';
  
  return { homeColor, awayColor };
}
