<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import ZonePicker from '../components/ZonePicker.vue'
import { useGameStore } from '../store/gameStore.js'
import AppButton from '../components/AppButton.vue'

const router    = useRouter()
const gameStore = useGameStore()

const settings = reactive({
  duration: null,
  zones: [{ sector: 20, type: 'A' }],
})

const customMinutes = ref(10)

const durationOptions = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: null, label: 'Infini' },
  { value: 'custom', label: 'Custom' },
]

const isCustomDuration = computed(() => settings.duration === 'custom')

function startGame() {
  const duration = settings.duration === 'custom'
    ? (Number(customMinutes.value) > 0 ? Number(customMinutes.value) : 5)
    : settings.duration
  gameStore.gameSettings = { mode: 'warmup', duration, zones: settings.zones }
  router.push({ name: 'warmup-game' })
}
</script>

<template>
  <div class="settings">
    <AppHeader title="ECHAUFFEMENT" @back="router.push({ name: 'home' })" />

    <main class="settings__main">
      <div class="settings__card">
        <div class="settings__section-label">Durée de la session</div>
        <div class="settings__duration">
          <div class="settings__duration-row">
            <AppButton v-for="opt in durationOptions.slice(0, 3)" :key="opt.value" size="small" variant="ghost"
              :active="settings.duration === opt.value" @click="settings.duration = opt.value">{{ opt.label }}
            </AppButton>
          </div>
          <div class="settings__duration-custom">
            <AppButton size="small" variant="ghost" :active="isCustomDuration" @click="settings.duration = 'custom'">
              Custom</AppButton>
            <div class="settings__custom-field" :class="{ 'settings__custom-field--visible': isCustomDuration }">
              <input type="number" v-model="customMinutes" min="1" max="120" class="settings__custom-input"
                placeholder="min" />
              <span class="settings__custom-label">min</span>
            </div>
          </div>
        </div>
      </div>

      <div class="settings__card zone-picker__card">
        <div class="settings__section-label">Zones à travailler</div>
        <ZonePicker :multiple="true" v-model="settings.zones" />
      </div>
    </main>

    <AppButton @click="startGame">COMMENCER</AppButton>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-md $padding-md 0;
  gap: $gap-xl;
  @include nav-safe-bottom;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0 auto;
    gap: $gap-xl;
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    &.zone-picker__card {
      flex: 1;
    }
  }

  &__section-label {
    @include title-lg;
    color: $white;
  }

  &__duration {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__duration-row {
    display: flex;
    gap: $gap-xs;

    :deep(.btn) {
      flex: 1;
    }
  }

  &__duration-custom {
    display: flex;
    align-items: center;

    :deep(.btn) {
      flex: 1;
      min-width: 0;
      transition: flex-grow 0.3s ease;
    }
  }

  &__custom-field {
    flex: 0 1 0%;
    min-width: 0;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: $gap-xs;
    opacity: 0;
    margin-left: 0;
    transition: flex-grow 0.3s ease, opacity 0.25s ease, margin-left 0.3s ease;

    &--visible {
      flex-grow: 1;
      opacity: 1;
      margin-left: $gap-xs;
    }
  }

  &__custom-input {
    flex: 1;
    min-width: 0;
    background: rgba($white, 0.05);
    border: none;
    border-radius: $radius-sm;
    color: $text-color;
    @include title-md;
    padding: $padding-xs $padding-sm;
    text-align: center;

    &:focus {
      outline: none;
      border-color: $orange;
    }
  }

  &__custom-label {
    @include title-md;
    white-space: nowrap;
  }
}

@media (min-width: $bp-tablet) {
  .settings {
    padding: $padding-xl $padding-xl 0;
    @include nav-safe-bottom($padding-xl);

    &__card:last-child {
      flex: 1;
    }

    &__section-label {
      @include title-xl;
    }
  }
}
</style>
