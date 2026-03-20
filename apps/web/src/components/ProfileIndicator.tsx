import { UserButton } from '@clerk/react'
import { useNavigate } from 'react-router-dom'
import { useProfileCompletion } from '@/hooks/useProfileCompletion'

interface ProfileIndicatorProps {
  size?: 'sm' | 'md'
}

export default function ProfileIndicator({ size = 'sm' }: ProfileIndicatorProps) {
  const navigate = useNavigate()
  const { percentage, isComplete, isLoading } = useProfileCompletion()

  const avatarSize = size === 'md' ? 'h-9 w-9' : 'h-8 w-8'

  // Determine ring color: green if complete, red if not
  const ringColor = isComplete ? 'ring-emerald-400' : 'ring-red-400'
  const glowColor = isComplete
    ? 'shadow-[0_0_10px_2px_rgba(52,211,153,0.5)]'
    : 'shadow-[0_0_10px_2px_rgba(248,113,113,0.5)]'

  if (isLoading) {
    return (
      <UserButton
        appearance={{
          elements: {
            avatarBox: `${avatarSize} ring-2 ring-primary/20`,
          },
        }}
      />
    )
  }

  return (
    <div className="relative group">
      <div className={`rounded-full ring-2 ${ringColor} ${glowColor} transition-shadow`}>
        <UserButton
          appearance={{
            elements: {
              avatarBox: avatarSize,
            },
          }}
        />
      </div>

      {/* Tooltip on hover */}
      <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
        <div
          className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg cursor-pointer pointer-events-auto"
          onClick={() => navigate('/profile/complete')}
        >
          {isComplete ? (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Profile 100% complete ✓
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              Profile {percentage}% complete — Click to finish
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
