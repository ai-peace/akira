import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { clientApplicationProperties } from '@/consts/client-application-properties'
import useUserPromptUsage from '@/hooks/resources/user-prompt-usage/usePromptUsage'
import { InfoIcon } from 'lucide-react'

const Component = () => {
  const { userPromptUsage, userPromptUsageIsLoading, userPromptUsageError, userPromptUsageMutate } =
    useUserPromptUsage()

  if (userPromptUsageIsLoading) return <Skeleton className="h-4 w-24" />
  if (userPromptUsageError) return <div>Error: {userPromptUsageError.message}</div>
  if (!userPromptUsage) return <Skeleton className="h-4 w-24" />

  return (
    <div>
      {userPromptUsage && (
        <div className="text-md flex items-center justify-between gap-1 px-1 font-semibold">
          {clientApplicationProperties.dailyPromptUsageLimit.perUser - userPromptUsage.count} /{' '}
          {clientApplicationProperties.dailyPromptUsageLimit.perUser} Credits
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  The number of prompts available per day.
                  <br />
                  Resets at 00:00 (UTC) every day.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}

export { Component as OUserPromptUsage }
