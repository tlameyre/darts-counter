import { ref, computed } from 'vue'

export function useDarts({ difficulty, maxQuestions, timeLimit, doubleValidation }) {
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

  // Phase 1 = deviner le total de la volée
  // Phase 2 = deviner le score restant (currentScore - volée)
  const phase         = ref(1)
  const voleeTotal    = ref(0) // mémorisé après phase 1

  // --- Timer ---
  const timeLeft = ref(timeLimit ?? 0)
  let _timer       = null
  let _autoAdvance = null

  // --- Computed ---
  const correctAnswer = computed(() => {
    if (phase.value === 1) {
      return currentVolee.value.reduce((sum, d) => sum + d.pts, 0)
    }
    // Phase 2 : score restant après la volée
    return currentScore.value - voleeTotal.value
  })

  const questionLabel = computed(() =>
    maxQuestions
      ? `${questionIndex.value} / ${maxQuestions}`
      : String(questionIndex.value)
  )

  const phaseLabel = computed(() =>
    phase.value === 2 ? 'Score restant ?' : 'Total de la volée ?'
  )

  // --- Dart generation ---
  function rand20() { return Math.floor(Math.random() * 20) + 1 }

  function generateDart() {
    const r = Math.random()
    if (difficulty === 'easy') {
      if (r < 0.05) return { type: 'miss', label: 'Miss', pts: 0 }
      const n = rand20(); return { type: 'single', label: String(n), pts: n }
    }
    if (difficulty === 'medium') {
      if (r < 0.04) return { type: 'miss', label: 'Miss', pts: 0 }
      if (r < 0.55) { const n = rand20(); return { type: 'single', label: String(n), pts: n } }
      const n = rand20(); return { type: 'double', label: `D${n}`, pts: n * 2 }
    }
    if (r < 0.03) return { type: 'miss', label: 'Miss', pts: 0 }
    if (r < 0.38) { const n = rand20(); return { type: 'single', label: String(n), pts: n     } }
    if (r < 0.62) { const n = rand20(); return { type: 'double', label: `D${n}`,   pts: n * 2 } }
    if (r < 0.88) { const n = rand20(); return { type: 'triple', label: `T${n}`,   pts: n * 3 } }
    if (r < 0.95) return { type: 'bull', label: 'Bull',   pts: 25 }
    return               { type: 'bull', label: 'D.Bull', pts: 50 }
  }

  function generateVolee(scoreLimit) {
    for (let i = 0; i < 50; i++) {
      const v = [generateDart(), generateDart(), generateDart()]
      if (v.reduce((s, d) => s + d.pts, 0) <= scoreLimit) return v
    }
    const darts = []; let budget = scoreLimit
    for (let i = 0; i < 3; i++) {
      if (budget <= 0) { darts.push({ type: 'miss', label: 'Miss', pts: 0 }); continue }
      const n = Math.floor(Math.random() * Math.min(budget, 20)) + 1
      darts.push({ type: 'single', label: String(n), pts: n })
      budget -= n
    }
    return darts
  }

  // --- Timers ---
  function stopTimer() { clearInterval(_timer); _timer = null }

  function startTimer() {
    stopTimer()
    if (!timeLimit) return
    timeLeft.value = timeLimit
    _timer = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) { stopTimer(); onTimeout() }
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
    if (phase.value === 1) streak.value = 0
    feedbackState.value = 'timeout'
    scheduleNextRound()
  }

  // --- Actions ---
  function nextRound() {
    clearTimeout(_autoAdvance)
    phase.value         = 1
    answered.value      = false
    inputValue.value    = ''
    feedbackState.value = null
    questionIndex.value++
    currentScore.value  = Math.floor(Math.random() * 500) + 2
    currentVolee.value  = generateVolee(currentScore.value)
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
      if (phase.value === 1) {
        streak.value++
        correctCount.value++
        if (streak.value > best.value) {
          best.value = streak.value
          localStorage.setItem('dartsBest', String(best.value))
        }

        // Si double validation activé → passer en phase 2
        if (doubleValidation) {
          voleeTotal.value    = correctAnswer.value
          feedbackState.value = 'phase1ok'  // feedback vert rapide
          // Transition vers phase 2 après 1s
          clearTimeout(_autoAdvance)
          _autoAdvance = setTimeout(() => {
            phase.value         = 2
            answered.value      = false
            inputValue.value    = ''
            feedbackState.value = null
            startTimer()
          }, 1000)
          return
        }
      }

      feedbackState.value = 'correct'
    } else {
      if (phase.value === 1) streak.value = 0
      feedbackState.value = 'wrong'
    }

    scheduleNextRound()
  }

  function cleanup() {
    stopTimer()
    clearTimeout(_autoAdvance)
  }

  return {
    currentScore, currentVolee, inputValue,
    feedbackState, answered, streak, best,
    questionIndex, correctCount, gameOver, timeLeft,
    phase, voleeTotal,
    correctAnswer, questionLabel, phaseLabel,
    nextRound, appendDigit, deleteDigit, validate, cleanup,
  }
}
