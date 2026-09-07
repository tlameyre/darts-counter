<script setup>
import { computed } from 'vue'
import DartPill from './DartPill.vue'
import { formatRoute } from '../../composables/useCheckouts.js'

const props = defineProps({
  checkout: { type: Object, default: null },
  highlightPrimary: { type: Boolean, default: true },
  size: { type: String, default: 'sm', validator: (v) => ['sm', 'md'].includes(v) },
  selectable: { type: Boolean, default: false },
  selected: { type: Array, default: null }, // Dart[] actif quand selectable
  played: { type: Array, default: null }, // Dart[] réellement lancées (quiz) — marque la ligne
})

const emit = defineEmits(['select'])

const rows = computed(() => {
  const c = props.checkout
  if (!c) return []
  const out = [{ key: 'primary', label: 'Recommandé', route: c.primary }]
  if (c.backup) {
    out.push({ key: 'backup', label: 'Plan B', route: c.backup.darts, leaves: c.backup.leaves })
  }
  c.options.forEach((route, i) => out.push({ key: `opt-${i}`, label: 'Autre', route }))
  return out
})

const selectedKey = computed(() => (props.selected ? formatRoute(props.selected) : null))
const playedKey = computed(() => (props.played?.length ? formatRoute(props.played) : null))

const isPlayed = (row) => playedKey.value != null && formatRoute(row.route) === playedKey.value

function rowClass(row) {
  return {
    'route-card__row--strong': row.key === 'primary' && props.highlightPrimary,
    'route-card__row--active': props.selectable && formatRoute(row.route) === selectedKey.value,
    'route-card__row--played': isPlayed(row),
  }
}
</script>

<template>
  <div v-if="rows.length" class="route-card">
    <component
      :is="selectable ? 'button' : 'div'"
      v-for="row in rows"
      :key="row.key"
      class="route-card__row"
      :class="rowClass(row)"
      @click="selectable && emit('select', row.route)"
    >
      <span class="route-card__tag">
        {{ row.label }}
        <span v-if="isPlayed(row)" class="route-card__played-tag">· jouée</span>
      </span>
      <span class="route-card__darts">
        <DartPill v-for="(d, j) in row.route" :key="j" :dart="d" :size="size" />
        <span v-if="row.leaves != null" class="route-card__leaves">→ laisse {{ row.leaves }}</span>
      </span>
    </component>
  </div>
  <p v-else class="route-card__none">Pas de route enregistrée pour ce score.</p>
</template>

<style lang="scss" scoped>
.route-card {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;
  width: 100%;

  &__row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xs;
    width: 100%;
    background: rgba($white, 0.05);
    border: $border-sm solid transparent;
    border-radius: $radius-md;
    padding: $padding-sm;
    transition: border-color 0.15s, background 0.15s;

    &--strong {
      background: rgba($accent, 0.15);
      border-color: rgba($accent, 0.4);
    }

    &--active {
      background: rgba($accent, 0.2);
      border-color: $accent;
    }

    &--played {
      border-color: $orange;
    }
  }

  button.route-card__row {
    cursor: pointer;

    &:active { opacity: 0.7; }
  }

  &__tag {
    align-self: flex-start;
    @include text-xs;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__played-tag {
    color: $orange;
  }

  &__darts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: $gap-xxs;
  }

  &__leaves {
    @include text-xs;
    color: $muted;
    margin-left: $gap-xxs;
  }

  &__none {
    @include text-sm;
    color: $muted;
    text-align: center;
  }
}

@media (min-width: $bp-laptop) {
  .route-card {
    &__tag { @include text-sm; }
    &__leaves { @include text-sm; }
  }
}
</style>
