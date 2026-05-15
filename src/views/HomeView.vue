<script setup>
import { reactive } from 'vue'
import OptionSelector from '../components/OptionSelector.vue'

const emit = defineEmits(['start'])

const settings = reactive({
  difficulty:       'easy',
  maxQuestions:     10,
  timeLimit:        null,
  doubleValidation: false,
})

const difficultyOptions = [
  { value: 'easy',   label: 'Facile'    },
  { value: 'medium', label: 'Moyen'     },
  { value: 'hard',   label: 'Difficile' },
]

const questionOptions = [
  { value: 10,   label: '10'       },
  { value: 20,   label: '20'       },
  { value: null, label: 'Illimité' },
]

const timeOptions = [
  { value: 15,   label: '15 s'  },
  { value: 30,   label: '30 s'  },
  { value: null, label: 'Libre' },
]
</script>

<template>
  <div class="home">
    <div class="home__hero">
      <span class="home__sub">TRAINING</span>
      <h1 class="home__title">DARTS<br>COUNTER</h1>
    </div>

    <div class="home__settings">
      <div class="home__card">
        <OptionSelector label="Difficulté des volées" :options="difficultyOptions" v-model="settings.difficulty" />
      </div>
      <div class="home__card">
        <OptionSelector label="Nombre de questions" :options="questionOptions" v-model="settings.maxQuestions" />
      </div>
      <div class="home__card">
        <OptionSelector label="Temps par question" :options="timeOptions" v-model="settings.timeLimit" />
      </div>

      <!-- Double calcul toggle -->
      <button
        class="home__toggle"
        :class="{ 'home__toggle--on': settings.doubleValidation }"
        @click="settings.doubleValidation = !settings.doubleValidation"
      >
        <div class="home__toggle-text">
          <span class="home__toggle-title">Double calcul</span>
          <span class="home__toggle-desc">
            Après une bonne réponse, calcule aussi le score restant
          </span>
        </div>
        <div class="home__toggle-switch" :class="{ 'home__toggle-switch--on': settings.doubleValidation }">
          <div class="home__toggle-knob" />
        </div>
      </button>
    </div>

    <button class="home__start" @click="emit('start', { ...settings })">
      JOUER
    </button>
  </div>
</template>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: 0 16px 40px;
  max-width: 420px;
  margin: 0 auto;

  &__hero {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 32px 0 28px;
    gap: 4px;
  }

  &__sub {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3px;
    color: $orange;
    text-transform: uppercase;
  }

  &__title {
    font-family: $font-display;
    font-size: 58px;
    line-height: 0.9;
    color: $text;
    letter-spacing: -1px;
  }

  &__settings {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__card {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: 16px;
  }

  // Double calcul toggle row
  &__toggle {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    text-align: left;
    transition: border-color 0.2s;

    &--on { border-color: rgba($orange, 0.6); }
  }

  &__toggle-text { flex: 1; }

  &__toggle-title {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: $text;
    margin-bottom: 2px;
  }

  &__toggle-desc {
    display: block;
    font-size: 11px;
    color: $muted;
    line-height: 1.4;
  }

  &__toggle-switch {
    width: 44px;
    height: 26px;
    background: $surface2;
    border: 1px solid $border;
    border-radius: $radius-pill;
    position: relative;
    flex-shrink: 0;
    transition: background 0.2s, border-color 0.2s;

    &--on {
      background: $orange;
      border-color: $orange;
    }
  }

  &__toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;

    .home__toggle-switch--on & { transform: translateX(18px); }
  }

  &__start {
    margin-top: 20px;
    background: $orange;
    border-radius: $radius-pill;
    color: #fff;
    font-family: $font-display;
    font-size: 20px;
    letter-spacing: 3px;
    padding: 17px;
    width: 100%;
    transition: background 0.15s, transform 0.1s;

    &:active { background: $orange-dark; transform: scale(0.98); }
  }
}
</style>
