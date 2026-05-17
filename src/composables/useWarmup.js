import { ref, computed } from 'vue'

export function useWarmup({ duration, trainZone }) {
  const darts    = ref([])
  const timeLeft = ref(duration * 60)
  const gameOver = ref(false)
  let _timer = null

  // --- Computed stats ---
  const totalDarts = computed(() => darts.value.length)

  const hits = computed(() =>
    darts.value.filter(d => isTargetHit(d)).length
  )

  const accuracy = computed(() =>
    totalDarts.value > 0 ? Math.round((hits.value / totalDarts.value) * 100) : 0
  )

  const timeDisplay = computed(() => {
    const m = Math.floor(timeLeft.value / 60)
    const s = timeLeft.value % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  })

  // La session est urgente (< 30s) pour feedback visuel
  const isUrgent = computed(() => timeLeft.value <= 30 && timeLeft.value > 0)

  // Breakdown par secteur (1-20) pour le récap
  const breakdown = computed(() => {
    const result = {}
    for (let i = 1; i <= 20; i++) result[i] = 0
    darts.value.forEach(d => {
      if (d.sector && isTargetHit(d)) result[d.sector] = (result[d.sector] || 0) + 1
    })
    return result
  })

  // --- Helpers ---
  function isTargetHit(dart) {
    if (dart.type === 'miss') return false
    if (trainZone === 'single') return dart.type === 'single'
    if (trainZone === 'double') return dart.type === 'double'
    if (trainZone === 'triple') return dart.type === 'triple'
    if (trainZone === 'bull')   return dart.type === 'bull' && dart.pts === 50
    if (trainZone === 'outer')  return dart.type === 'bull' && dart.pts === 25
    return false
  }

  // --- Actions ---
  function recordDart(dart) {
    if (gameOver.value) return
    darts.value.push({ ...dart, ts: Date.now() })
  }

  function undoLast() {
    if (gameOver.value || darts.value.length === 0) return
    darts.value.pop()
  }

  function startTimer() {
    clearInterval(_timer)
    _timer = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        clearInterval(_timer)
        gameOver.value = true
      }
    }, 1000)
  }

  function endSession() {
    clearInterval(_timer)
    gameOver.value = true
  }

  function cleanup() {
    clearInterval(_timer)
  }

  const totalScore = computed(() =>
    darts.value.reduce((sum, d) => sum + d.pts, 0)
  )

  return {
    darts, timeLeft, timeDisplay, isUrgent, gameOver,
    totalDarts, hits, accuracy, totalScore, breakdown,
    recordDart, undoLast, startTimer, endSession, cleanup,
  }
}
