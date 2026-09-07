<script setup>
import { ref, shallowRef, computed, watch } from 'vue'
import AppIcon from '../AppIcon.vue'
import CheckoutRouteCard from './CheckoutRouteCard.vue'
import CheckoutBoardRoute from './CheckoutBoardRoute.vue'

const props = defineProps({
  score: { type: Number, default: null },
  checkout: { type: Object, default: null },
  revealed: { type: Boolean, default: false },
  done: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
})

const emit = defineEmits(['toggle', 'grade']) // grade payload: true = acquis, false = à revoir

const fillPct = computed(() => Math.round((props.done / props.total) * 100))

// Route affichée sur la cible — remise sur la recommandée à chaque carte.
const selectedRoute = shallowRef(null)
watch(
  () => props.score,
  () => { selectedRoute.value = props.checkout?.primary ?? null },
  { immediate: true },
)

// ─── Geste swipe / tap (Pointer Events : souris + tactile) ───────────
const cardEl = ref(null)
const dragX = ref(0)
const dragging = ref(false)
const flying = ref(false)
const animating = ref(false)

let startX = 0
let startY = 0
let dirLocked = null // 'h' | 'v' | null
let capturedId = null

const SWIPE = 60
const FLY_MS = 200 // doit rester égal à la durée de transition transform/opacity de .deck__card

function capture(id) {
  try { cardEl.value?.setPointerCapture(id) } catch { /* pointeur déjà relâché */ }
}
function release(id) {
  try { cardEl.value?.releasePointerCapture(id) } catch { /* rien à relâcher */ }
}

const cardStyle = computed(() => ({
  transform: `translateX(${dragX.value}px) rotate(${dragX.value * 0.02}deg)`,
  opacity: String(Math.max(0, Math.min(1, 1 - Math.abs(dragX.value) / 500))),
  transition: !dragging.value && flying.value ? `transform ${FLY_MS}ms ease, opacity ${FLY_MS}ms ease` : 'none',
}))

function onDown(e) {
  if (animating.value) return
  startX = e.clientX
  startY = e.clientY
  dirLocked = null
  dragging.value = true
  capturedId = e.pointerId
  // pas de setPointerCapture ici : sinon les clics sur les lignes de route
  // (boutons) ne remontent plus. On capture seulement si un drag horizontal démarre.
}

function onMove(e) {
  if (!dragging.value) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (!dirLocked) {
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
    dirLocked = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h'
    if (dirLocked === 'v') {
      dragging.value = false // laisse le scroll vertical
      return
    }
    capture(e.pointerId) // drag horizontal confirmé : on prend le pointeur
  }
  // avant révélation, le swipe horizontal ne sert à rien : on n'entraîne pas la carte
  if (props.revealed) dragX.value = dx
}

function onUp() {
  if (!dragging.value) {
    dirLocked = null
    return
  }
  dragging.value = false
  release(capturedId)
  const dx = dragX.value

  const isTap = dirLocked !== 'h' || Math.abs(dx) < 8
  if (isTap) {
    dragX.value = 0
    // recto : tap = révéler. verso : le retour passe par le bouton dédié.
    if (!props.revealed) emit('toggle')
    return
  }
  if (props.revealed && dx >= SWIPE) return grade(true)
  if (props.revealed && dx <= -SWIPE) return grade(false)
  snapBack()
}

function snapBack() {
  flying.value = true
  dragX.value = 0
  setTimeout(() => { flying.value = false }, FLY_MS)
}

function grade(known) {
  if (animating.value) return
  animating.value = true
  flying.value = true
  dragX.value = (known ? 1 : -1) * 520
  setTimeout(() => {
    emit('grade', known) // le parent remonte la carte suivante : props (score/checkout/revealed) changent ici
    flying.value = false
    dragX.value = 0
    // `animating` reste vrai un instant de plus pour couper le crossfade recto/verso
    // (sinon le verso, déjà sur la nouvelle sortie, reste visible le temps de son fondu).
    setTimeout(() => { animating.value = false }, 50)
  }, FLY_MS)
}
</script>

<template>
  <div class="deck">
    <div class="deck__top">
      <div class="deck__bar"><div class="deck__bar-fill" :style="{ width: fillPct + '%' }" /></div>
      <span class="deck__counter">{{ done }} / {{ total }}</span>
    </div>

    <div
      ref="cardEl"
      class="deck__card"
      :style="cardStyle"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    >
      <div class="deck__face" :class="{ 'deck__face--hidden': revealed, 'deck__face--no-transition': animating }">
        <div class="deck__score">{{ score }}</div>
        <p class="deck__hint">Tape pour révéler la sortie</p>
      </div>
      <button v-if="revealed" type="button" class="deck__back" aria-label="Revenir au score" @click="emit('toggle')">
        <AppIcon name="arrow-left" :width="22" :height="22" />
      </button>

      <div class="deck__face deck__face--back" :class="{ 'deck__face--hidden': !revealed, 'deck__face--no-transition': animating }">
        <button type="button" class="deck__board-btn" @click="emit('toggle')">
          <CheckoutBoardRoute :route="selectedRoute || []" class="deck__board" />
        </button>
        <div class="deck__detail">
          <div class="deck__value">{{ score }}</div>
          <CheckoutRouteCard
            :checkout="checkout"
            size="md"
            selectable
            :selected="selectedRoute"
            class="deck__routes"
            @select="selectedRoute = $event"
          />
        </div>
      </div>
    </div>

    <div class="deck__actions">
      <template v-if="revealed">
        <div class="deck__grades">
          <button class="deck__grade deck__grade--again" @click="grade(false)">
            <AppIcon name="undo" :width="18" :height="18" /> À revoir
          </button>
          <button class="deck__grade deck__grade--good" @click="grade(true)">
            <AppIcon name="check" :width="18" :height="18" /> Acquis
          </button>
        </div>
      </template>
      <button v-else class="deck__reveal" @click="emit('toggle')">Révéler</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.deck {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-md;

  &__top {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    flex-shrink: 0;
  }

  &__bar {
    flex: 1;
    height: 6px;
    border-radius: $radius-pill;
    background: rgba($white, 0.12);
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    border-radius: $radius-pill;
    background: $accent;
    transition: width 0.25s ease;
  }

  &__counter {
    @include text-xs;
    color: $muted;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  &__card {
    position: relative;
    flex: 1;
    min-height: 0;
    background: rgba($white, 0.05);
    border: $border-sm solid rgba($white, 0.08);
    border-radius: $radius-lg;
    overflow: hidden;
    touch-action: pan-y;
    user-select: none;
    will-change: transform;
  }

  &__face {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $gap-md;
    padding: $padding-lg;
    transition: opacity 0.15s ease;

    &--back {
      justify-content: flex-start;
      gap: $gap-md;
      overflow: hidden;
      padding-bottom: 0;
    }

    &--hidden {
      opacity: 0;
      pointer-events: none;
    }

    &--no-transition {
      transition: none;
    }
  }

  &__score {
    @include display-xl;
    color: $white;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  &__hint {
    @include text-sm;
    color: $muted;
  }

  &__back {
    position: absolute;
    top: $padding-sm;
    left: $padding-sm;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: $radius-sm;
    background: rgba($white, 0.08);
    color: $white;
    cursor: pointer;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__board-btn {
    flex-shrink: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    cursor: pointer;

    &:active { opacity: 0.85; }
  }

  &__board {
    flex-shrink: 0;
  }

  &__detail {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-md;
    flex: 1;
    min-height: 0;
    width: 100%;
  }

  &__value {
    @include display-sm;
    color: $white;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    flex-shrink: 0;
  }

  &__routes {
    width: 100%;
    max-width: 460px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-bottom: $padding-lg;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    flex-shrink: 0;
  }

  &__ask {
    @include text-sm;
    color: $muted;
    text-align: center;
  }

  &__grades {
    display: flex;
    gap: $gap-sm;

    > * { flex: 1; }
  }

  &__reveal,
  &__grade {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    height: 48px;
    border-radius: $radius-sm;
    @include title-sm;
    font-weight: 700;
    text-transform: uppercase;
    transition: filter 0.15s;

    &:active { filter: brightness(1.15); }
  }

  &__reveal {
    background: $orange;
    color: $white;
  }

  &__grade--again {
    background: rgba($error, 0.18);
    color: $error-light;
    border: $border-sm solid rgba($error, 0.4);
  }

  &__grade--good {
    background: rgba($accent, 0.2);
    color: $accent-light;
    border: $border-sm solid rgba($accent, 0.5);
  }
}

@media (min-width: $bp-laptop) {
  .deck {
    &__counter { @include text-sm; }
    &__hint { @include text-md; }
    &__reveal, &__grade { height: 52px; @include title-md; }

    // Verso : cible à gauche, finish + routes à droite
    &__face--back {
      flex-direction: row;
      align-items: stretch;
      gap: $gap-xl;
      padding: $padding-xl;
    }

    &__board-btn {
      flex: 1;
      min-width: 0;
      width: auto;
      align-items: center;
    }

    &__detail {
      flex: 1;
      min-width: 0;
      align-items: stretch;
      gap: $gap-lg;
    }

    &__value { text-align: center; }

    &__routes { max-width: none; }
  }
}
</style>
