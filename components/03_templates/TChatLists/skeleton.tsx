import { EResizablePanel } from '@/components/01_elements/EResizablePanel'
import { Skeleton } from '@/components/ui/skeleton'

const Component = () => {
  return (
    <EResizablePanel>
      <div className="h-full overflow-x-auto overflow-y-auto px-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="pl-8">
            <Skeleton className="my-3 h-3 w-[100%]" />
            <div className="pl-8">
              <Skeleton className="my-3 h-3 w-[100%]" />
            </div>
            <div className="pl-8">
              <Skeleton className="my-3 h-3 w-[100%]" />
            </div>
            <div className="pl-8">
              <Skeleton className="my-3 h-3 w-[100%]" />
            </div>
            <Skeleton className="my-3 h-3 w-[100%]" />
            <div className="pl-8">
              <Skeleton className="my-3 h-3 w-[100%]" />
            </div>
            <div className="pl-8">
              <Skeleton className="my-3 h-3 w-[100%]" />
            </div>
            <div className="pl-8">
              <Skeleton className="my-3 h-3 w-[100%]" />
            </div>
            <Skeleton className="my-3 h-3 w-[100%]" />
            <div className="pl-8">
              <Skeleton className="my-3 h-3 w-[100%]" />
            </div>
            <div className="pl-8">
              <Skeleton className="my-3 h-3 w-[100%]" />
            </div>
            <div className="pl-8">
              <Skeleton className="my-3 h-3 w-[100%]" />
            </div>
          </div>
        ))}
      </div>
    </EResizablePanel>
  )
}

export { Component as TDocumentTreeSkeleton }
