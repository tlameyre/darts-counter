import { ref, computed } from 'vue'

const DIFFICULTIES = ['easy', 'medium', 'hard']

export function useDarts() {
  // --- Persistent state ---
  const best = ref(parseInt(localStorage.getItem('dartsBest') || '0'))

  // --- Game state ---
  const difficulty = ref('easy')
  const currentScore = ref(0)
  const currentVolee = ref([])
  const inputValue = ref('')
  const feedbackState = ref(null) // null | 'correct' | 'wrong'
  const answered = ref(false)
  const streak = ref(0)

  // --- Computed ---
  const correctAnswer = computed(() =>
    currentVolee.value.reduce((sum, d) => sum + d.pts, 0)
  )

  // --- Dart generation ---
  function generateDart() {
    const r = Math.random()

    if (difficulty.value === 'easy') {
      if (r < 0.05) return { type: 'miss', label: 'Miss', pts: 0 }
      const n = rand20()
      return { type: 'single', label: String(n), pts: n }
    }

    if (difficulty.value === 'medium') {
      if (r < 0.04) return { type: 'miss', label: 'Miss', pts: 0 }
      if (r < 0.55) {
        const n = rand20()
        return { type: 'single', label: String(n), pts: n }
      }
      const n = rand20()
      return { type: 'double', label: `D${n}`, pts: n * 2 }
    }

    // hard
    if (r < 0.03) return { type: 'miss', label: 'Miss', pts: 0 }
    if (r < 0.38) { const n = rand20(); return { type: 'single', label: String(n), pts: n } }
    if (r < 0.62) { const n = rand20(); return { type: 'double', label: `D${n}`, pts: n * 2 } }
    if (r < 0.88) { const n = rand20(); return { type: 'triple', label: `T${n}`, pts: n * 3 } }
    if (r < 0.95) return { type: 'bull', label: 'Bull', pts: 25 }
    return { type: 'bull', label: 'D.Bull', pts: 50 }
  }

  function rand20() {
    return Math.floor(Math.random() * 20) + 1
  }

  // --- Actions ---
  function setDifficulty(d) {
    if (!DIFFICULTIES.includes(d)) return
    difficulty.value = d
    nextRound()
  }

  function nextRound() {
    answered.value = false
    inputValue.value = ''
    feedbackState.value = null
    currentScore.value = Math.floor(Math.random() * 500) + 2
    currentVolee.value = [generateDart(), generateDart(), generateDart()]
  }

  function appendDigit(digit) {
    if (answered.value || inputValue.value.length >= 3) return
    inputValue.value += digit
  }

  function deleteDigit() {
    if (answered.value) return
    inputValue.value = inputValue.value.slice(0, -1)
  }

  function validate() {
    if (answered.value) {
      nextRound()
      return
    }

    const userAnswer = parseInt(inputValue.value)
    if (isNaN(userAnswer)) return

    answered.value = true

    if (userAnswer === correctAnswer.value) {
      streak.value++
      if (streak.value > best.value) {
        best.value = streak.value
        localStorage.setItem('dartsBest', String(best.value))
      }
      feedbackState.value = 'correct'
    } else {
      streak.value = 0
      feedbackState.value = 'wrong'
    }
  }

  return {
    // state
    difficulty,
    currentScore,
    currentVolee,
    inputValue,
    feedbackState,
    answered,
    streak,
    best,
    // computed
    correctAnswer,
    // actions
    setDifficulty,
    nextRound,
    appendDigit,
    deleteDigit,
    validate,
  }
}
