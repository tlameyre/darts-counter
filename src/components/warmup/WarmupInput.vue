<script setup>
import { ref, computed } from 'vue'
import DartSlotsBar from '../game/DartSlotsBar.vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  darts:    { type: Array,   required: true },
  locked:   { type: Boolean, default: false },
  zones:    { type: Array,   required: true },
  // Restreint chaque ligne à un seul bouton (ex. 'double' pendant une phase où
  // seul un double compte). null/absent = comportement normal (S/D/T ou Outer/Bull).
  onlyType:     { type: String, default: null },
  // Remplace le libellé du bouton restant quand onlyType est utilisé (ex. "DOUBLE"
  // plutôt que "D20" quand le secteur annoncé n'a pas d'importance).
  labelOverride: { type: String, default: null },
})

const emit = defineEmits(['dart', 'miss', 'undo'])

const buttonGroups = computed(() => props.zones.map(zone => {
  const isBull = zone.sector === null
  let buttons = isBull
    ? [
        { key: 'outer', label: 'Outer' },
        { key: 'bull',  label: 'Bull'  },
      ]
    : [
        { key: 'single', label: `S${zone.sector}` },
        { key: 'double', label: `D${zone.sector}` },
        { key: 'triple', label: `T${zone.sector}` },
      ]
  if (props.onlyType) {
    buttons = buttons.filter(b => b.key === props.onlyType)
    if (props.labelOverride) buttons = buttons.map(b => ({ ...b, label: props.labelOverride }))
  }
  return { zone, isBull, buttons }
}))

const pressedKey = ref(null)
let _pressTimer = null

function tap(btn, zone) {
  if (props.locked) return
  clearTimeout(_pressTimer)
  const key = `${zone.sector}-${btn.key}`
  pressedKey.value = key
  _pressTimer = setTimeout(() => { pressedKey.value = null }, 160)

  if (zone.sector === null) {
    if (btn.key === 'outer') {
      emit('dart', { type: 'bull', sector: null, pts: 25, label: 'Outer' })
    } else {
      emit('dart', { type: 'bull', sector: null, pts: 50, label: 'Bull' })
    }
  } else {
    const s = zone.sector
    if (btn.key === 'single') {
      emit('dart', { type: 'single', sector: s, pts: s,     label: `S${s}` })
    } else if (btn.key === 'double') {
      emit('dart', { type: 'double', sector: s, pts: s * 2, label: `D${s}` })
    } else {
      emit('dart', { type: 'triple', sector: s, pts: s * 3, label: `T${s}` })
    }
  }
}
</script>

<template>
  <div class="warmup-input">
    <DartSlotsBar :darts="darts" value-key="label" />

    <div class="warmup-input__grid">
      <div
        v-for="group in buttonGroups"
        :key="group.zone.sector ?? 'bull'"
        class="warmup-input__zone-row"
        :class="{
          'warmup-input__zone-row--bull':   group.isBull,
          'warmup-input__zone-row--single': group.buttons.length === 1,
        }"
      >
        <button
          v-for="btn in group.buttons"
          :key="btn.key"
          class="warmup-input__btn"
          :class="{ 'warmup-input__btn--pressed': pressedKey === `${group.zone.sector}-${btn.key}` }"
          :disabled="locked"
          @click="tap(btn, group.zone)"
        >
          {{ btn.label }}
        </button>
      </div>

      <div class="warmup-input__actions">
        <button class="warmup-input__action-btn" @click="$emit('undo')">
          <AppIcon name="undo" :width="28" :height="28" />
        </button>
        <button
          class="warmup-input__action-btn warmup-input__action-btn--miss"
          :disabled="locked"
          @click="$emit('miss')"
        >
          MANQUÉ
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.warmup-input {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-md;

  &__grid {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-top: $border-md solid $white;
    border-left: $border-md solid $white;
  }

  &__zone-row {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);

    &--bull {
      grid-template-columns: repeat(2, 1fr);
    }

    &--single {
      grid-template-columns: 1fr;
    }
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    @include display-sm;
    color: $white;
    border-right: $border-md solid $white;
    border-bottom: $border-md solid $white;
    transition: filter 0.1s;

    &--pressed {
      filter: brightness(1.45);
    }

    &:disabled {
      opacity: 0.4;
    }
  }

  &__actions {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr 2fr;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    color: $white;
    border-right: $border-md solid $white;
    border-bottom: $border-md solid $white;
    transition: filter 0.1s;

    &--miss {
      @include title-xl;
    }

    &:active {
      filter: brightness(1.45);
    }

    &:disabled {
      opacity: 0.4;
    }
  }
}

@media (min-width: $bp-laptop) {
  .warmup-input__btn  { @include display-md; }
  .warmup-input__action-btn--miss { @include title-xxl; }
}
</style>
