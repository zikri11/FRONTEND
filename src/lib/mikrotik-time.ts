export const parseMikrotikTime = (timeStr?: string): number => {
  if (!timeStr || timeStr === '-') return 0
  let totalSeconds = 0
  
  const weekMatch = timeStr.match(/(\d+)w/)
  const dayMatch = timeStr.match(/(\d+)d/)
  const hourMatch = timeStr.match(/(\d+)h/)
  const minMatch = timeStr.match(/(\d+)m/)
  const secMatch = timeStr.match(/(\d+)s/)
  
  if (weekMatch) totalSeconds += parseInt(weekMatch[1], 10) * 604800
  if (dayMatch) totalSeconds += parseInt(dayMatch[1], 10) * 86400
  if (hourMatch) totalSeconds += parseInt(hourMatch[1], 10) * 3600
  if (minMatch) totalSeconds += parseInt(minMatch[1], 10) * 60
  if (secMatch) totalSeconds += parseInt(secMatch[1], 10)

  if (totalSeconds === 0 && !isNaN(Number(timeStr))) {
     return Number(timeStr)
  }
  return totalSeconds
}

export const formatToReadableTime = (timeStr?: string): string => {
  if (!timeStr || timeStr === '-') return '-'
  
  const weekMatch = timeStr.match(/(\d+)w/)
  const dayMatch = timeStr.match(/(\d+)d/)
  const hourMatch = timeStr.match(/(\d+)h/)
  const minMatch = timeStr.match(/(\d+)m/)
  
  const parts = []
  if (weekMatch) parts.push(`${weekMatch[1]} Mgg`)
  if (dayMatch) parts.push(`${dayMatch[1]} Hari`)
  if (hourMatch) parts.push(`${hourMatch[1]} Jam`)
  if (minMatch) parts.push(`${minMatch[1]} Mnt`)
  
  if (parts.length === 0) {
    const secMatch = timeStr.match(/(\d+)s/)
    if (secMatch) parts.push(`${secMatch[1]} Dtk`)
  }
  
  return parts.length > 0 ? parts.join(' ') : timeStr
}
