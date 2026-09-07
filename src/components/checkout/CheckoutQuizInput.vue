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
    <div class="quiz__card">
      <span class="quiz__card-count">{{ counter }}</span>
      <span class="quiz__card-label">Reste</span>
      <span class="quiz__card-score">{{ score }}</span>
    </div>

    <DartSlotsBar
      class="quiz__slots"
      :mode="inputMode"
      :modes="['board', 'dart']"
      :toggleable="!answered"
      :darts="attemptDarts"
      value-key="label"
      @select="setInputMode"
    />

    <div v-if="!answered" class="quiz__board" :class="{ 'quiz__board--grid': inputMode === 'dart' }">
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

    <template v-if="!answered">
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
      <div class="quiz__feedback" :class="`quiz__feedback--${banner.cls}`">{{ banner.text }}</div>
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
</template>

<style lang="scss" scoped>
.quiz {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
  overflow-y: auto;

  &__card {
    position: relative;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
    padding: $padding-md;
    background: $orange;
    border-radius: $radius-lg;
    text-align: center;
  }

  &__card-count {
    position: absolute;
    top: $padding-sm;
    right: $padding-md;
    @include text-xs;
    color: rgba($white, 0.7);
    font-variant-numeric: tabular-nums;
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

  &__next { margin-top: $gap-xs; }

  &__feedback {
    @include title-md;
    text-align: center;
    border-radius: $radius-md;
    padding: $padding-sm;

    &--ok { background: rgba($accent, 0.18); color: $accent-light; }
    &--ko { background: rgba($error, 0.18); color: $error-light; }
  }

  &__study {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-sm;
  }

  &__board-route { width: 100%; }

  &__routes { width: 100%; max-width: 420px; }
}

@media (min-width: $bp-laptop) {
  .quiz {
    &__card-label { @include text-md; }
    &__card-score { @include display-md; }

    &__study {
      flex-direction: row;
      align-items: flex-start;
      justify-content: center;
      gap: $gap-xl;
    }

    &__board-route { flex: 1; min-width: 0; }
    &__routes { flex: 1; min-width: 0; max-width: 460px; }
  }
}
</style>
