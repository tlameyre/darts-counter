<script setup>
import { reactive } from 'vue'
import { useRouter }     from 'vue-router'
import AppHeader         from '../components/AppHeader.vue'
import OptionSelector    from '../components/OptionSelector.vue'
import { gameSettings }  from '../store/gameStore.js'

const router = useRouter()

const settings = reactive({
  duration:  5,
  trainZone: 'double',
})

const durationOptions = [
  { value: 2,  label: '2 min'  },
  { value: 5,  label: '5 min'  },
  { value: 10, label: '10 min' },
]

const zoneOptions = [
  { value: 'single', label: 'Simple'  },
  { value: 'double', label: 'Double'  },
  { value: 'triple', label: 'Triple'  },
  { value: 'bull',   label: 'Bull'    },
  { value: 'outer',  label: 'Outer'   },
]

function startGame() {
  gameSettings.value = { ...settings, mode: 'warmup' }
  router.push({ name: 'warmup-game' })
}
</script>

<template>
  <div class="settings">
    <AppHeader title="ECHAUFFEMENT" @back="router.push({ name: 'lobby' })" />

    <main class="settings__main">
      <div class="settings__cards">
        <div class="settings__card">
          <OptionSelector
            label="Durée de la session"
            :options="durationOptions"
            v-model="settings.duration"
          />
        </div>
        <div class="settings__card">
          <OptionSelector
            label="Zone à travailler"
            :options="zoneOptions"
            v-model="settings.trainZone"
          />
        </div>
      </div>

      <button class="settings__start" @click="startGame">
        COMMENCER
      </button>
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
    flex: 1;
    justify-content: center;
  }

  &__card {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $padding-sm;
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

    &:active { background: #1E40AF; transform: scale(0.98); }
  }
}
</style>
