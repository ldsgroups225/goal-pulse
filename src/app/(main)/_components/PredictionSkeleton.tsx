// src/app/(main)/_components/PredictionSkeleton.tsx

export function PredictionSkeleton() {
  const randomId = Math.random().toString(36).substring(2, 9)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array.from({ length: 6 })].map(() => (
        <div
          key={randomId}
          className="w-full h-[220px] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
      ))}
    </div>
  )
}
