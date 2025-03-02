// src/app/(main)/_components/PredictionSkeleton.tsx

export function PredictionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array.from({ length: 6 })].map((_, i) => (
        <div
          key={i}
          className="w-full h-[220px] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
      ))}
    </div>
  )
}
