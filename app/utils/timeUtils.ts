export const formatHMS = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const parseHMS = (input: string): number | null => {
  const regex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/
  const match = input.match(regex)
  
  if (!match) return null
  
  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const seconds = parseInt(match[3], 10)
  
  if (hours < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
    return null
  }
  
  return hours * 3600 + minutes * 60 + seconds
}

export const isCurrentInject = (currentSeconds: number, injectDueSeconds: number): boolean => {
  const timeDiff = Math.abs(currentSeconds - injectDueSeconds)
  return timeDiff <= 30
}