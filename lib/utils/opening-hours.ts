/**
 * Verifica se o estabelecimento está aberto no momento atual
 * baseado no horário de funcionamento
 */
export function isRestaurantOpen(openingHours: string | null | undefined): boolean {
  if (!openingHours || !openingHours.trim()) {
    // Se não houver horário definido, assume que está aberto
    return true
  }

  const now = new Date()
  const currentDay = now.getDay() // 0 = Domingo, 1 = Segunda, etc.
  const currentTime = now.getHours() * 60 + now.getMinutes() // Minutos desde meia-noite

  // Mapear dia da semana para o formato do horário
  const dayMap: Record<number, string> = {
    0: "Dom",
    1: "Seg",
    2: "Ter",
    3: "Qua",
    4: "Qui",
    5: "Sex",
    6: "Sáb",
  }

  const currentDayKey = dayMap[currentDay]
  if (!currentDayKey) return true

  // Parse do horário de funcionamento
  const lines = openingHours.split(/\r?\n/)
  for (const line of lines) {
    // Ex: "Seg: 11:00-23:00" ou "Sáb: Fechado"
    const match = line.match(new RegExp(`^${currentDayKey}\\s*:\\s*(.*)$`, "i"))
    if (!match) continue

    const schedule = match[1].trim()

    // Se estiver fechado
    if (/fechad[oa]/i.test(schedule)) {
      return false
    }

    // Parse do horário (ex: "11:00-23:00")
    const timeMatch = schedule.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
    if (!timeMatch) continue

    const openHour = parseInt(timeMatch[1])
    const openMinute = parseInt(timeMatch[2])
    const closeHour = parseInt(timeMatch[3])
    const closeMinute = parseInt(timeMatch[4])

    const openTime = openHour * 60 + openMinute
    const closeTime = closeHour * 60 + closeMinute

    // Verificar se o horário atual está dentro do intervalo
    if (closeTime < openTime) {
      // Horário que cruza a meia-noite (ex: 22:00-02:00)
      return currentTime >= openTime || currentTime <= closeTime
    } else {
      // Horário normal (ex: 11:00-23:00)
      return currentTime >= openTime && currentTime <= closeTime
    }
  }

  // Se não encontrou o dia, assume que está aberto
  return true
}

