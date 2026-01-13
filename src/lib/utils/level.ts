// Calculate level based on XP
export function calculateLevel(xp: number): { level: number; currentXp: number; nextLevelXp: number } {
  // XP required for each level: level * 100
  let level = 1
  let totalXpRequired = 0

  while (xp >= totalXpRequired + level * 100) {
    totalXpRequired += level * 100
    level++
  }

  const currentXp = xp - totalXpRequired
  const nextLevelXp = level * 100

  return { level, currentXp, nextLevelXp }
}
