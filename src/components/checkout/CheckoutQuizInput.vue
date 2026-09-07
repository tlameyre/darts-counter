<script setup>
import { ref, computed } from 'vue'
import AppButton from '../AppButton.vue'
import AppIcon from '../AppIcon.vue'
import SvgDartboard from '../x01/SvgDartboard.vue'
import SectorGrid from '../game/SectorGrid.vue'
import DartSlotsBar from '../game/DartSlotsBar.vue'
import CheckoutRouteCard from './CheckoutRouteCard.vue'

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
  lastResult: { type: Object, default: null }, // { correct, optimal, points }
  progress: { type: Object, required: true },
})

const emit = defineEmits(['dart', 'undo', 'submit', 'next'])

const counter = computed(() => `${props.progress.index + 1} / ${props.progress.total}`)
const isLast = computed(() => props.progress.index + 1 >= props.progress.total)
const remaining = computed(
  () => props.score - props.attemptDarts.reduce((s, d) => s + d.pts, 0),
)

const banner = computed(() => {
  const r = props.lastResult
  if (!r) return null
  if (r.optimal) return { cls: 'ok', text: `Parfait — route recommandée · +${r.points}` }
  if (r.correct) return { cls: 'ok', text: `Sortie valide · +${r.points}` }
  return { cls: 'ko', text: 'Sortie invalide' }
})
</script>

<template>
  <div class="quiz">
    <div class="quiz__head">
      <span class="quiz__counter">{{ counter }}</span>
      <span class="quiz__target">Reste <strong>{{ score }}</strong></span>
      <span class="quiz__remaining" :class="{ 'quiz__remaining--done': remaining === 0 }">
      </span>
    </div>

    <DartSlotsBar
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
      <CheckoutRouteCard :checkout="checkout" class="quiz__routes" />
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

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-sm;
  }

  &__counter {
    @include text-sm;
    color: $muted;
    font-variant-numeric: tabular-nums;
  }

  &__target {
    @include text-md;
    color: $white;

    strong { @include title-lg; }
  }

  &__remaining {
    @include title-lg;
    color: $muted;
    font-variant-numeric: tabular-nums;
    min-width: 2.5ch;
    text-align: right;

    &--done { color: $accent; }
  }

  &__board {
    display: flex;
    justify-content: center;
    padding: $padding-xs 0;

    &--grid {
      padding: 0;
      height: 340px;
      flex-shrink: 0;
    }
  }

  &__actions {
    display: flex;
    gap: $gap-sm;
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

  &__routes { align-self: center; max-width: 420px; }
}

@media (min-width: $bp-laptop) {
  .quiz {
    &__counter { @include text-md; }
    &__target { @include text-lg; }
    &__routes { max-width: 520px; }
  }
}
</style>
