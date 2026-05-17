<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import OptionSelector from '../components/OptionSelector.vue'
import ZonePicker from '../components/ZonePicker.vue'
import { gameSettings } from '../store/gameStore.js'

const router = useRouter()

const settings = reactive({
  duration: null,
  zone: { sector: 20, type: 'A' },
})

const customMinutes = ref(10)

const durationOptions = [
  { value: null, label: 'Illimité' },
  { value: 2, label: '2 min' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 'custom', label: 'Perso' },
]

const isCustomDuration = computed(() => settings.duration === 'custom')

function startGame() {
  const duration = settings.duration === 'custom'
    ? (Number(customMinutes.value) > 0 ? Number(customMinutes.value) : 5)
    : settings.duration
  gameSettings.value = { mode: 'warmup', duration, zone: settings.zone }
  router.push({ name: 'warmup-game' })
}
</script>

<template>
  <div class="settings">
    <AppHeader title="ECHAUFFEMENT" @back="router.push({ name: 'lobby' })" />

    <main class="settings__main">
      <div class="settings__cards">
        <div class="settings__card">
          <OptionSelector label="Durée de la session" :options="durationOptions" v-model="settings.duration" />
          <div v-if="isCustomDuration" class="settings__custom-duration">
            <input type="number" v-model="customMinutes" min="1" max="120" class="settings__custom-input"
              placeholder="Minutes" />
            <span class="settings__custom-label">minutes</span>
          </div>
        </div>

        <div class="settings__card">
          <div class="settings__zone-label">Zone à travailler</div>
          <ZonePicker v-model="settings.zone" />
        </div>
      </div>

      <button class="settings__start" @click="startGame">COMMENCER</button>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    max-width: 420px;
    width: 100%;
    margin: 0 auto;
    padding: $padding-xs $padding-md $padding-xl;
    gap: $padding-lg;
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: $padding-xs;
  }

  &__card {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $padding-sm;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__zone-label {
    font-size: $text-xs;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: $muted;
    font-weight: 700;
  }

  &__custom-duration {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    margin-top: $padding-xxs;
  }

  &__custom-input {
    width: 80px;
    background: rgba($white, 0.05);
    border: 1.5px solid $border;
    border-radius: $radius-md;
    color: $text-color;
    font-family: $font-body;
    font-size: $text-sm;
    font-weight: 700;
    padding: $padding-xs $padding-sm;
    text-align: center;

    &:focus {
      outline: none;
      border-color: $orange;
    }
  }

  &__custom-label {
    font-size: $text-sm;
    color: $muted;
  }

  &__start {
    background: #1D4ED8;
    border-radius: $radius-pill;
    color: $white;
    font-family: $font-display;
    font-size: $title-sm;
    letter-spacing: 2px;
    padding: $padding-md;
    width: 100%;
    transition: background 0.15s, transform 0.1s;

    &:active {
      background: #1E40AF;
      transform: scale(0.98);
    }
  }
}
</style>
