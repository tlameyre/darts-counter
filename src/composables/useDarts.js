import { ref, computed } from 'vue'

export function useDarts({ difficulty, maxQuestions, timeLimit }) {
  // --- Persistent ---
  const best = ref(parseInt(localStorage.getItem('dartsBest') || '0'))

  // --- Game state ---
  const streak        = ref(0)
  const questionIndex = ref(0)
  const correctCount  = ref(0)
  const gameOver      = ref(false)

  // --- Round state ---
  const currentScore  = ref(0)
  const currentVolee  = ref([])
  const inputValue    = ref('')
  const feedbackState = ref(null) // null | 'correct' | 'wrong' | 'timeout'
  const answered      = ref(false)

  // --- Timer ---
  const timeLeft = ref(timeLimit ?? 0)
  let _timer       = null
  let _autoAdvance = null

  // --- Computed ---
  const correctAnswer = computed(() =>
    currentVolee.value.reduce((sum, d) => sum + d.pts, 0)
  )

  const timerProgress = computed(() =>
    timeLimit ? timeLeft.value / timeLimit : 1
  )

  const questionLabel = computed(() =>
    maxQuestions
      ? `${questionIndex.value} / ${maxQuestions}`
      : String(questionIndex.value)
  )

  // --- Dart generation ---
  function rand20() {
    return Math.floor(Math.random() * 20) + 1
  }

  function generateDart() {
    const r = Math.random()

    if (difficulty === 'easy') {
      if (r < 0.05) return { type: 'miss', label: 'Miss', pts: 0 }
      const n = rand20()
      return { type: 'single', label: String(n), pts: n }
    }

    if (difficulty === 'medium') {
      if (r < 0.04) return { type: 'miss', label: 'Miss', pts: 0 }
      if (r < 0.55) { const n = rand20(); return { type: 'single', label: String(n), pts: n } }
      const n = rand20()
      return { type: 'double', label: `D${n}`, pts: n * 2 }
    }

    // hard
    if (r < 0.03) return { type: 'miss',   label: 'Miss',        pts: 0      }
    if (r < 0.38) { const n = rand20(); return { type: 'single', label: String(n), pts: n     } }
    if (r < 0.62) { const n = rand20(); return { type: 'double', label: `D${n}`,   pts: n * 2 } }
    if (r < 0.88) { const n = rand20(); return { type: 'triple', label: `T${n}`,   pts: n * 3 } }
    if (r < 0.95) return { type: 'bull', label: 'Bull',   pts: 25 }
    return               { type: 'bull', label: 'D.Bull', pts: 50 }
  }

  // --- Timers ---
  function stopTimer() {
    clearInterval(_timer)
    _timer = null
  }

  function startTimer() {
    stopTimer()
    if (!timeLimit) return
    timeLeft.value = timeLimit
    _timer = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        stopTimer()
        onTimeout()
      }
    }, 1000)
  }

  function scheduleNextRound() {
    clearTimeout(_autoAdvance)
    _autoAdvance = setTimeout(() => {
      if (gameOver.value) return
      if (maxQuestions !== null && questionIndex.value >= maxQuestions) {
        gameOver.value = true
      } else {
        nextRound()
      }
    }, 3000)
  }

  function onTimeout() {
    answered.value = true
    streak.value = 0
    feedbackState.value = 'timeout'
    scheduleNextRound()
  }

  // --- Actions ---
  function nextRound() {
    clearTimeout(_autoAdvance)

    answered.value      = false
    inputValue.value    = ''
    feedbackState.value = null
    questionIndex.value++
    currentScore.value  = Math.floor(Math.random() * 500) + 2
    currentVolee.value  = [generateDart(), generateDart(), generateDart()]
    startTimer()
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
    if (answered.value) return

    const userAnswer = parseInt(inputValue.value)
    if (isNaN(userAnswer)) return

    stopTimer()
    answered.value = true

    if (userAnswer === correctAnswer.value) {
      streak.value++
      correctCount.value++
      if (streak.value > best.value) {
        best.value = streak.value
        localStorage.setItem('dartsBest', String(best.value))
      }
      feedbackState.value = 'correct'
    } else {
      streak.value = 0
      feedbackState.value = 'wrong'
    }

    scheduleNextRound()
  }

  function cleanup() {
    stopTimer()
    clearTimeout(_autoAdvance)
  }

  return {
    // state
    currentScore, currentVolee, inputValue,
    feedbackState, answered, streak, best,
    questionIndex, correctCount, gameOver, timeLeft,
    // computed
    correctAnswer, timerProgress, questionLabel,
    // actions
    nextRound, appendDigit, deleteDigit, validate, cleanup,
  }
}
