export const getResourceInitials = (label: string, length = 2): string => {
  const safeLabel = typeof label === 'string' ? label.trim() : ''
  if (!safeLabel) return 'RS'

  const words = safeLabel.split(/\s+/).filter(Boolean)
  const initialsFromWords = words.slice(0, length).map((word) => word[0]).join('')

  if (initialsFromWords.length >= length) {
    return initialsFromWords.slice(0, length).toUpperCase()
  }

  const alphanumeric = safeLabel.replace(/[^a-zA-Z0-9]/g, '')
  if (alphanumeric.length >= length) {
    return alphanumeric.slice(0, length).toUpperCase()
  }

  return (initialsFromWords + alphanumeric).slice(0, length || 2).toUpperCase() || 'RS'
}
