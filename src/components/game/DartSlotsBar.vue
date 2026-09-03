<script setup>
import { ref, computed } from 'vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  mode:       { type: String,  default: 'dart' },   // 'dart' | 'board' | 'volley'
  darts:      { type: Array,   default: () => [] },
  valueKey:   { type: String,  default: 'value' },
  value:      { type: String,  default: '' },        // saisie en cours (mode volée)
  bust:       { type: Boolean, default: false },
  toggleable: { type: Boolean, default: false },
  modes:      { type: Array,   default: () => ['dart', 'board', 'volley'] },
})

const emit = defineEmits(['select', 'validate'])

const MODE_OPTIONS = [
  { id: 'dart',   icon: 'numpad',   label: 'Grille' },
  { id: 'board',  icon: 'dartboard', label: 'Cible' },
  { id: 'volley', icon: 'dialpad',  label: 'Volée' },
]

const options = computed(() => MODE_OPTIONS.filter(o => props.modes.includes(o.id)))

const currentIcon = computed(() => MODE_OPTIONS.find(o => o.id === props.mode)?.icon ?? 'numpad')

const isOpen = ref(false)

function toggleOpen() {
  if (props.bust) return
  isOpen.value = !isOpen.value
}

function selectMode(id) {
  isOpen.value = false
  emit('select', id)
}
</script>

<template>
  <div class="dart-bar-wrap">
    <div class="dart-bar" :class="{ 'dart-bar--bust': bust }">

      <div v-if="toggleable" class="dart-bar__icon-wrap">
        <button class="dart-bar__icon" :disabled="bust" @click="toggleOpen">
          <AppIcon :name="currentIcon" :width="34" :height="34" />
        </button>
      </div>
      <div v-else class="dart-bar__icon-wrap">
        <div class="dart-bar__icon">
          <AppIcon name="dartboard" :width="34" :height="34" />
        </div>
      </div>

      <template v-if="bust">
        <div class="dart-bar__bust-label">BUST !</div>
      </template>

      <template v-else-if="mode === 'dart' || mode === 'board'">
        <div v-for="i in 3" :key="i" class="dart-bar__slot">
          <Transition name="slot-pop">
            <span v-if="darts[i - 1]" :key="String(darts[i - 1][valueKey]) + i" class="dart-bar__value">
              {{ darts[i - 1][valueKey] }}
            </span>
          </Transition>
        </div>
      </template>

      <template v-else>
        <div class="dart-bar__volley-value" :class="{ 'dart-bar__volley-value--placeholder': !value }">
          {{ value || 'Score de la volée' }}
        </div>
        <button class="dart-bar__ok" @click="$emit('validate')">OK</button>
      </template>

    </div>

    <div v-if="isOpen" class="dart-bar__popover-backdrop" @click="isOpen = false" />
    <div v-if="isOpen" class="dart-bar__popover">
      <button
        v-for="option in options"
        :key="option.id"
        class="dart-bar__popover-option"
        :class="{ 'dart-bar__popover-option--active': option.id === mode }"
        @click="selectMode(option.id)"
      >
        <AppIcon :name="option.icon" :width="22" :height="22" />
        <span>{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dart-bar-wrap {
  position: relative;
  flex-shrink: 0;
}

.dart-bar {
  display: flex;
  align-items: stretch;
  background: $white;
  border-radius: $radius-pill;
  overflow: hidden;
  padding: $padding-sm;
  padding-left: $padding-lg;
  flex-shrink: 0;
  transition: background 0.2s;

  &--bust {
    background: $error;
  }

  &__icon-wrap {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: $padding-md;
    color: $black;
    flex-shrink: 0;
    transition: opacity 0.15s;

    &:is(button) {
      &:active   { opacity: 0.5; }
      &:disabled { opacity: 0.4; }
    }
  }

  &__popover-backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
  }

  &__popover {
    position: absolute;
    top: calc(100% + #{$gap-xs});
    left: $padding-sm;
    z-index: 41;
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
    background: $white;
    border-radius: $radius-md;
    padding: $padding-xs;
    min-width: 160px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }

  &__popover-option {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-xs $padding-sm;
    border-radius: $radius-sm;
    color: $black;
    @include text-sm;
    white-space: nowrap;
    transition: background 0.15s;

    &:active {
      background: rgba($black, 0.08);
    }

    &--active {
      background: $accent;
      color: $white;
    }
  }

  &__slot {
    color: $black;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: $border-md solid $black;
    overflow: hidden;
    min-height: 36px;
  }

  &__value {
    @include title-xl;
    font-variant-numeric: tabular-nums;
  }

  &__bust-label {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-xl;
    font-weight: 700;
    color: $white;
    border-left: $border-md solid rgba($white, 0.4);
    letter-spacing: 0.08em;
  }

  &__volley-value {
    flex: 1;
    display: flex;
    align-items: center;
    padding-left: $padding-md;
    border-left: $border-md solid $black;
    @include title-xl;
    color: $black;
    font-variant-numeric: tabular-nums;

    &--placeholder {
      @include text-sm;
      color: $input-placeholder;
    }
  }

  &__ok {
    background: $accent;
    border-radius: $radius-pill;
    color: $white;
    @include title-md;
    padding: $padding-xs $padding-xl;
    margin-left: $gap-xs;
    transition: background 0.15s, transform 0.1s;
    white-space: nowrap;
    flex-shrink: 0;

    &:active {
      transform: scale(0.95);
      background: $accent-dark;
    }
  }
}

.slot-pop-enter-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.slot-pop-enter-from {
  transform: scale(0.5);
  opacity: 0;
}

@media (min-width: $bp-laptop) {
  .dart-bar {
    padding: $padding-md;

    &__slot      { min-height: 48px; }
    &__value     { @include title-xxl; }
    &__bust-label { @include title-xxl; }
    &__volley-value {
      @include title-xxl;
      &--placeholder { @include text-md; }
    }
    &__ok { @include title-lg; padding: $padding-sm $padding-xxl; }
  }
}
</style>
