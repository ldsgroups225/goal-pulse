'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CountryFlagProps {
  country: string;
  imagePath?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CountryFlag({ country, imagePath, size = 'sm', className }: CountryFlagProps) {
  // Define size dimensions
  const dimensions = {
    sm: { width: 16, height: 12 },
    md: { width: 20, height: 15 },
    lg: { width: 24, height: 18 },
  };
  
  const { width, height } = dimensions[size];

  if (!imagePath) {
    // If no image path, render a fallback
    return (
      <div 
        className={cn(
          "inline-flex items-center justify-center rounded overflow-hidden bg-gray-200 dark:bg-gray-700",
          className
        )}
        style={{ width, height }}
        title={country}
      />
    );
  }
  
  return (
    <div 
      className={cn(
        "inline-flex items-center justify-center rounded overflow-hidden border border-border/40 dark:border-border/30 shadow-sm",
        className
      )}
      style={{ width, height }}
    >
      <Image 
        src={imagePath} 
        alt={`${country} flag`}
        width={width}
        height={height}
        className="object-cover w-full h-full"
      />
    </div>
  );
}
