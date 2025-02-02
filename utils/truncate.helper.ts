type TruncatePosition = 'start' | 'middle' | 'end'

export const truncateText = (
  text: string | undefined | null,
  maxLength: number = 20,
  position: TruncatePosition = 'end',
): string => {
  if (!text) return ''
  if (text.length <= maxLength) return text

  const ellipsis = '...'
  const charsToShow = maxLength - ellipsis.length

  switch (position) {
    case 'start':
      return ellipsis + text.slice(-charsToShow)
    case 'middle': {
      const startChars = Math.ceil(charsToShow / 2)
      const endChars = Math.floor(charsToShow / 2)
      return text.slice(0, startChars) + ellipsis + text.slice(-endChars)
    }
    case 'end':
    default:
      const truncated = text.slice(0, maxLength).split(' ').slice(0, -1).join(' ')
      return `${truncated}${ellipsis}`
  }
}
