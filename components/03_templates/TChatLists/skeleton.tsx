import { Skeleton } from '@/components/ui/skeleton'

const Component = () => {
  return (
    <div className="h-full overflow-x-auto overflow-y-auto px-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index}>
          <Skeleton className="my-3 h-3 w-[100%]" />
          <Skeleton className="my-3 h-3 w-[100%]" />
          <Skeleton className="my-3 h-3 w-[100%]" />
          <Skeleton className="my-3 h-3 w-[100%]" />
          <Skeleton className="my-3 h-3 w-[100%]" />
          <Skeleton className="my-3 h-3 w-[100%]" />
          <Skeleton className="my-3 h-3 w-[100%]" />
          <Skeleton className="my-3 h-3 w-[100%]" />
          <Skeleton className="my-3 h-3 w-[100%]" />
          <Skeleton className="my-3 h-3 w-[100%]" />
          <Skeleton className="my-3 h-3 w-[100%]" />
          <Skeleton className="my-3 h-3 w-[100%]" />
          <Skeleton className="my-3 h-3 w-[100%]" />
          <Skeleton className="my-3 h-3 w-[100%]" />
          <Skeleton className="my-3 h-3 w-[100%]" />
        </div>
      ))}
    </div>
  )
}

export { Component as TChatListsSkeleton }
