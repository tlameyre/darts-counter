<script setup>
import { ref, shallowRef, computed, watch } from 'vue'
import AppButton from '../AppButton.vue'
import AppIcon from '../AppIcon.vue'
import SvgDartboard from '../x01/SvgDartboard.vue'
import SectorGrid from '../game/SectorGrid.vue'
import DartSlotsBar from '../game/DartSlotsBar.vue'
import CheckoutRouteCard from './CheckoutRouteCard.vue'
import CheckoutBoardRoute from './CheckoutBoardRoute.vue'

const INPUT_KEY = 'checkout-quiz-input'
const inputMode = ref(
  (() => {
    try {
      return localStorage.getItem(INPUT_KEY) === 'dart' ? 'dart' : 'board'
    } catch {
      return 'board'
    }
  })(),
)
function setInputMode(m) {
  inputMode.value = m
  try {
    localStorage.setItem(INPUT_KEY, m)
  } catch {
    /* stockage indisponible */
  }
}

const props = defineProps({
  score: { type: Number, default: null },
  checkout: { type: Object, default: null },
  attemptDarts: { type: Array, required: true },
  answered: { type: Boolean, default: false },
  lastResult: { type: Object, default: null }, // { score, darts, correct, optimal, points }
  progress: { type: Object, required: true },
})

const emit = defineEmits(['dart', 'undo', 'submit', 'next'])

const counter = computed(() => `${props.progress.index + 1} / ${props.progress.total}`)
const isLast = computed(() => props.progress.index + 1 >= props.progress.total)

const banner = computed(() => {
  const r = props.lastResult
  if (!r) return null
  if (r.optimal) return { cls: 'ok', text: `Parfait — route recommandée · +${r.points}` }
  if (r.correct) return { cls: 'ok', text: `Sortie valide · +${r.points} — la recommandée compte double` }
  return { cls: 'ko', text: 'Sortie invalide' }
})

const cardClass = computed(() =>
  props.answered && banner.value ? `quiz__card--${banner.value.cls}` : null,
)

// Route affichée sur la cible dans l'écran de correction. On la remet sur celle
// réellement jouée (si valide) ou la recommandée, puis on laisse changer pour
// continuer d'apprendre les autres sorties en plein quiz.
const playedRoute = computed(() => (props.lastResult?.correct ? props.lastResult.darts : null))
const studyRoute = shallowRef(null)
watch(
  () => props.answered,
  (a) => {
    if (a) studyRoute.value = playedRoute.value ?? props.checkout?.primary ?? null
  },
)
</script>

<template>
  <div class="quiz">
    <div class="quiz__card" :class="cardClass">
      <span class="quiz__card-count">Question {{ counter }}</span>
      <div class="quiz__card-body">
        <span class="quiz__card-label">Reste</span>
        <span class="quiz__card-score">{{ score }}</span>
        <span v-if="answered && banner" class="quiz__card-result">{{ banner.text }}</span>
      </div>
    </div>

    <div class="quiz__main">
      <DartSlotsBar
        class="quiz__slots"
        :mode="inputMode"
        :modes="['board', 'dart']"
        :toggleable="!answered"
        :darts="attemptDarts"
        value-key="label"
        @select="setInputMode"
      />

      <template v-if="!answered">
        <div class="quiz__board" :class="{ 'quiz__board--grid': inputMode === 'dart' }">
          <SectorGrid
            v-if="inputMode === 'dart'"
            :locked="attemptDarts.length >= 3"
            @dart="emit('dart', $event)"
          />
          <SvgDartboard
            v-else
            :locked="attemptDarts.length >= 3"
            zoomable
            fill
            @dart="emit('dart', $event)"
          />
        </div>

        <div class="quiz__actions">
          <button class="quiz__undo" :disabled="!attemptDarts.length" @click="emit('undo')">
            <AppIcon name="undo" :width="24" :height="24" />
          </button>
          <AppButton class="quiz__submit" :disabled="!attemptDarts.length" @click="emit('submit')">
            Valider
          </AppButton>
        </div>
      </template>

      <template v-else>
        <div class="quiz__study">
          <CheckoutBoardRoute :route="studyRoute || []" class="quiz__board-route" />
          <CheckoutRouteCard
            :checkout="checkout"
            size="md"
            selectable
            :selected="studyRoute"
            :played="playedRoute"
            class="quiz__routes"
            @select="studyRoute = $event"
          />
        </div>
        <AppButton class="quiz__next" @click="emit('next')">
          {{ isLast ? 'Voir le récap' : 'Suivant' }}
        </AppButton>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.quiz {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
  overflow: hidden;

  &__main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__card {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-md;
    background: $orange;
    border-radius: $radius-lg;
    text-align: center;
    transition: background 0.2s;

    &--ok { background: $accent-dark; }
    &--ko { background: $error-dark; }
  }

  &__card-count {
    flex-shrink: 0;
    @include text-sm;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgba($white, 0.75);
    font-variant-numeric: tabular-nums;
  }

  &__card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $gap-xxs;
  }

  &__card-result {
    margin-top: $gap-xxs;
    @include text-sm;
    color: $white;
  }

  &__card-label {
    @include text-sm;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $white;
  }

  &__card-score {
    @include display-sm;
    line-height: 1;
    color: $white;
    font-variant-numeric: tabular-nums;
  }

  &__slots { flex-shrink: 0; }

  &__board {
    flex: 1;
    min-height: 0;
    container-type: size;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $padding-xs 0;

    &--grid {
      container-type: normal;
      align-items: stretch;
      padding: 0;
    }
  }

  &__actions {
    display: flex;
    gap: $gap-sm;
    flex-shrink: 0;
  }

  &__undo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    flex-shrink: 0;
    border: $border-md solid $white;
    border-radius: $radius-sm;
    color: $white;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
    &:disabled { opacity: 0.3; }
  }

  &__submit { flex: 1; }

  &__next {
    margin-top: $gap-xs;
    flex-shrink: 0;
  }

  // Only the route list scrolls, so "Suivant" stays visible.
  &__study {
    flex: 1;
    min-height: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-sm;
  }

  // Cap the board so the route list keeps usable height on small screens.
  &__study &__board-route {
    flex-shrink: 0;
    width: auto;
    height: min(30vh, 240px);
  }

  &__routes {
    width: 100%;
    max-width: 420px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
}

@media (min-width: $bp-laptop) {
  .quiz {
    max-width: none;
    flex-direction: row;
    align-items: stretch;
    justify-content: center;
    gap: $gap-xl;

    &__main {
      max-width: 760px;
    }

    &__card {
      width: 340px;
      flex-shrink: 0;
    }

    &__card-count { @include text-md; }
    &__card-label { @include text-md; }
    &__card-score { @include display-lg; }
    &__card-result { @include text-md; }
    &__tour { @include title-lg; }

    &__study {
      flex: 1;
      min-height: 0;
      flex-direction: row;
      align-items: stretch;
      justify-content: center;
      gap: $gap-xl;
    }

    &__study &__board-route {
      flex: 1;
      min-width: 0;
      width: auto;
      height: auto;
      align-self: center;
    }
    &__routes { flex: 1; min-width: 0; max-width: 460px; }
  }
}
</style>
