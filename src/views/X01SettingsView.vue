<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import X01BotSettings from '../components/x01/X01BotSettings.vue'
import X01PlayerPicker from '../components/x01/X01PlayerPicker.vue'
import X01PlayerOrderList from '../components/x01/X01PlayerOrderList.vue'
import { useGameStore } from '../store/gameStore.js'
import { useAuthStore } from '../store/authStore.js'
import { useFriendStore } from '../store/friendStore.js'

const router      = useRouter()
const gameStore   = useGameStore()
const authStore   = useAuthStore()
const friendStore = useFriendStore()

const SCORE_OPTIONS = [101, 170, 301, 501]
const MIN_LEGS      = 1
const MAX_LEGS      = 9
const MAX_PLAYERS   = 4

const settings = reactive({
  scoreKey:  301,
  legsToWin: 2,
})
const customScore = ref(401)
const aiProfile   = ref(null)
const showPicker  = ref(false)

// Ordre libre : "moi" (déplaçable comme les autres) + amis/invités ajoutés
const players = ref([
  { id: 'me', name: authStore.profile?.username ?? 'Toi', isMe: true },
])

// Le profil peut se charger après le montage de la vue
watch(() => authStore.profile, (profile) => {
  const me = players.value.find(p => p.isMe)
  if (me && profile?.username) me.name = profile.username
})

const isCustomScore  = computed(() => settings.scoreKey === 'custom')
const effectiveScore = computed(() =>
  isCustomScore.value ? Math.max(1, Number(customScore.value) || 501) : settings.scoreKey
)

const canAddMore = computed(() => players.value.length < MAX_PLAYERS)

function decrementLegs() {
  settings.legsToWin = Math.max(MIN_LEGS, settings.legsToWin - 1)
}

function incrementLegs() {
  settings.legsToWin = Math.min(MAX_LEGS, settings.legsToWin + 1)
}

const selectedPlayerIds = computed(() => players.value.map(p => p.id))

function onPlayersSelected(newPlayers) {
  const remaining = MAX_PLAYERS - players.value.length
  players.value.push(...newPlayers.slice(0, remaining))
  showPicker.value = false
}

function removePlayer(index) {
  if (players.value[index]?.isMe) return
  players.value.splice(index, 1)
}

function openPicker() {
  if (!friendStore.friends.length) friendStore.fetchFriends()
  showPicker.value = true
}

function startGame() {
  gameStore.gameSettings = {
    mode:       'x01',
    startScore: effectiveScore.value,
    legsToWin:  settings.legsToWin,
    aiProfile:  aiProfile.value,
    players:    players.value,
  }
  const needsStarterDraw = players.value.length > 1 && !aiProfile.value
  router.push({ name: needsStarterDraw ? 'x01-starter' : 'x01-game' })
}
</script>

<template>
  <div class="settings">
    <AppHeader title="501" @back="router.push({ name: 'play' })" />

    <main class="settings__main">

      <!-- Score de départ -->
      <div class="settings__card">
        <div class="settings__section-label">Score de départ</div>
        <div class="settings__row">
          <AppButton
            v-for="s in SCORE_OPTIONS" :key="s"
            size="small" variant="ghost" :active="settings.scoreKey === s"
            @click="settings.scoreKey = s"
          >{{ s }}</AppButton>
          <AppButton size="small" variant="ghost" :active="isCustomScore" @click="settings.scoreKey = 'custom'">
            Custom
          </AppButton>
        </div>
        <Transition name="slide-fade">
          <div v-if="isCustomScore" class="settings__custom-field">
            <input
              v-model.number="customScore"
              type="number" min="1" max="9999"
              class="settings__custom-input"
              placeholder="ex: 701"
            />
            <span class="settings__custom-label">pts</span>
          </div>
        </Transition>
      </div>

      <!-- Manches à gagner -->
      <div class="settings__card">
        <div class="settings__section-label">Manches à gagner</div>
        <div class="settings__stepper">
          <button
            class="settings__stepper-btn"
            :disabled="settings.legsToWin <= MIN_LEGS"
            @click="decrementLegs"
          >−</button>
          <span class="settings__stepper-value">{{ settings.legsToWin }}</span>
          <button
            class="settings__stepper-btn"
            :disabled="settings.legsToWin >= MAX_LEGS"
            @click="incrementLegs"
          >+</button>
        </div>
        <p class="settings__hint">
          La partie se termine après {{ settings.legsToWin }} manche{{ settings.legsToWin > 1 ? 's' : '' }}.
        </p>
      </div>

      <!-- Joueurs -->
      <div class="settings__card">
        <div class="settings__section-label">Joueurs</div>

        <p class="settings__hint">Glisse pour définir l'ordre des joueurs.</p>

        <X01PlayerOrderList v-model="players" removable @remove="removePlayer" />

        <!-- Bouton ajouter -->
        <button v-if="canAddMore" class="settings__add-player" @click="openPicker">
          + Ajouter un joueur
        </button>
        <p v-else class="settings__hint">Maximum {{ MAX_PLAYERS }} joueurs atteint.</p>
      </div>

      <!-- Adversaire DartBot -->
      <div class="settings__card">
        <X01BotSettings v-model="aiProfile" />
      </div>

    </main>

    <AppButton @click="startGame">COMMENCER</AppButton>

    <!-- Picker amis/invités -->
    <X01PlayerPicker
      :show="showPicker"
      :friends="friendStore.friends"
      :selected-ids="selectedPlayerIds"
      :max-additional="MAX_PLAYERS - players.length"
      @close="showPicker = false"
      @select="onPlayersSelected"
    />
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-md $padding-md calc($padding-xxl + 64px);
  gap: $gap-md;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-xxl;
    padding: $padding-md 0;
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__section-label {
    @include title-lg;
    color: $white;
  }

  &__row {
    display: flex;
    gap: $gap-xs;

    :deep(.btn) { flex: 1; }
  }

  &__stepper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-lg;
  }

  &__stepper-btn {
    width: 44px;
    height: 44px;
    border-radius: $radius-pill;
    border: $border-md solid rgba($white, 0.15);
    background: rgba($white, 0.05);
    color: $text-color;
    @include title-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s, color 0.15s, opacity 0.15s;

    &:active:not(:disabled) {
      border-color: $orange;
      color: $orange;
    }

    &:disabled {
      opacity: 0.3;
    }
  }

  &__stepper-value {
    @include display-sm;
    color: $white;
    min-width: 48px;
    text-align: center;
  }

  &__custom-field {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__custom-input {
    flex: 1;
    background: rgba($white, 0.05);
    border: $border-md solid rgba($white, 0.15);
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
    color: $muted;
    white-space: nowrap;
  }

  &__hint {
    @include title-sm;
    color: $muted;
  }

  &__add-player {
    @include text-sm;
    color: $muted;
    padding: $padding-sm $padding-md;
    border-radius: $radius-md;
    border: $border-sm dashed rgba($white, 0.2);
    text-align: center;
    transition: border-color 0.15s, color 0.15s;

    &:active {
      border-color: $orange;
      color: $orange;
    }
  }
}

@media (min-width: $bp-laptop) {
  .settings {
    padding: $padding-xl $padding-xl calc($padding-xxl + 64px);
    gap: $gap-lg;

    &__main {
      gap: $gap-xxl;
      padding: $padding-lg 0;
    }

    &__section-label  { @include title-xl; }
    &__stepper-btn    { @include title-xl; }
    &__stepper-value  { @include display-md; }
    &__custom-input   { @include title-lg; padding: $padding-sm $padding-md; }
    &__custom-label   { @include title-lg; }
    &__hint           { @include title-md; }
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
