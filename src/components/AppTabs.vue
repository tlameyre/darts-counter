<script setup>
defineProps({
  // [{ id, label, color? }]
  tabs:       { type: Array,   required: true },
  modelValue: { type: String,  required: true },
  variant:    { type: String,  default: 'pill' }, // 'pill' | 'underline'
  scrollable: { type: Boolean, default: false },  // défile horizontalement + snap
})

const emit = defineEmits(['update:modelValue'])

function select(tab, e) {
  emit('update:modelValue', tab.id)
  e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
}
</script>

<template>
  <div class="app-tabs" :class="[`app-tabs--${variant}`, { 'app-tabs--scrollable': scrollable }]">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="app-tabs__tab"
      :class="{ 'app-tabs__tab--active': modelValue === tab.id }"
      :style="modelValue === tab.id && tab.color ? { '--tab-color': tab.color } : {}"
      @click="select(tab, $event)"
    >
      <slot :name="tab.id">{{ tab.label }}</slot>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.app-tabs {
  display: flex;

  // ── Pill (StatsView) ──────────────────────────────────────────────────────
  &--pill {
    gap: $gap-xs;
    background: rgba($white, 0.05);
    border-radius: $radius-md;
    padding: 4px;

    .app-tabs__tab {
      flex: 1;
      padding: $padding-xs $padding-sm;
      border-radius: calc($radius-md - 4px);
      @include title-sm;
      font-weight: 700;
      text-transform: uppercase;
      color: $muted;
      transition: background 0.2s, color 0.2s;
      letter-spacing: 0.03em;

      &--active {
        background: var(--tab-color, $orange);
        color: $white;
      }
    }
  }

  // ── Scrollable + snap (combine avec --pill) ───────────────────────────────
  &--scrollable {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar { display: none; }

    .app-tabs__tab {
      flex: 1 0 auto;
      min-width: max-content;
      white-space: nowrap;
      scroll-snap-align: center;
    }
  }

  // ── Underline (FriendsView) ───────────────────────────────────────────────
  &--underline {
    border-bottom: $border-sm solid rgba($white, 0.07);

    .app-tabs__tab {
      @include title-sm;
      flex: 1;
      padding: $padding-sm 0;
      color: $muted;
      border-bottom: 2px solid transparent;
      transition: color 0.15s, border-color 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $gap-xs;

      &--active {
        color: $orange;
        border-bottom-color: $orange;
      }

      &:active { opacity: 0.7; }
    }
  }
}

@media (min-width: $bp-laptop) {
  .app-tabs--pill .app-tabs__tab {
    @include title-md;
    padding: $padding-sm $padding-md;
  }

  .app-tabs--underline .app-tabs__tab {
    @include title-md;
  }
}
</style>
