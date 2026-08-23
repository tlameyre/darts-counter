<script setup>
defineProps({
  show:       { type: Boolean, required: true },
  winnerName: { type: String,  default: null },   // null = "Tu as..."
  totalDarts: { type: Number,  required: true },
  volleys:    { type: Array,   required: true },
})

defineEmits(['next'])
</script>

<template>
  <Transition name="slide-up">
    <div v-if="show" class="leg-recap">
      <div class="leg-recap__card">

        <div class="leg-recap__winner">
          <template v-if="winnerName">🎯 {{ winnerName }} a fermé le plateau !</template>
          <template v-else>🎯 Tu as fermé le plateau !</template>
        </div>

        <div class="leg-recap__stats">
          <div class="leg-recap__stat">
            <span class="leg-recap__stat-val">{{ totalDarts }}</span>
            <span class="leg-recap__stat-lbl">fléchettes</span>
          </div>
          <div class="leg-recap__stat">
            <span class="leg-recap__stat-val">{{ volleys.length }}</span>
            <span class="leg-recap__stat-lbl">tours</span>
          </div>
        </div>

        <button class="leg-recap__next" @click="$emit('next')">
          Manche suivante →
        </button>

      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.leg-recap {
  position: fixed;
  inset: 0;
  background: $bg;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $padding-xl $padding-md;

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-lg;
    width: 100%;
    max-width: 380px;
  }

  &__winner {
    @include title-lg;
    font-weight: 700;
    color: $accent;
    text-align: center;
  }

  &__stats {
    display: flex;
    gap: $gap-xl;
    justify-content: center;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
  }

  &__stat-val {
    @include title-xxxl;
    font-weight: 700;
    color: $white;
    line-height: 1;
  }

  &__stat-lbl {
    @include title-xs;
    color: $muted;
    text-align: center;
  }

  &__next {
    width: 100%;
    background: $orange;
    border-radius: $radius-sm;
    padding: $padding-md;
    @include title-md;
    font-weight: 700;
    text-transform: uppercase;
    color: $white;
    transition: opacity 0.15s;

    &:active { opacity: 0.8; }
  }
}

@media (min-width: $bp-laptop) {
  .leg-recap {
    &__winner    { @include title-xl; }
    &__stat-val  { @include display-sm; }
    &__stat-lbl  { @include title-sm; }
    &__next      { @include title-lg; }
  }
}

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from,
.slide-up-leave-to     { transform: translateY(40px); opacity: 0; }
</style>
