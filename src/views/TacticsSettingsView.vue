<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import X01PlayerPicker from '../components/x01/X01PlayerPicker.vue'
import X01PlayerOrderList from '../components/x01/X01PlayerOrderList.vue'
import { useGameStore } from '../store/gameStore.js'
import { useAuthStore } from '../store/authStore.js'
import { useFriendStore } from '../store/friendStore.js'

const router      = useRouter()
const gameStore   = useGameStore()
const authStore   = useAuthStore()
const friendStore = useFriendStore()

const MIN_LEGS    = 1
const MAX_LEGS    = 9
const MAX_PLAYERS = 4

const settings = reactive({ legsToWin: 1 })
const showPicker = ref(false)

const players = ref([
  { id: 'me', name: authStore.profile?.username ?? 'Toi', isMe: true },
])

watch(() => authStore.profile, (profile) => {
  const me = players.value.find(p => p.isMe)
  if (me && profile?.username) me.name = profile.username
})

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
    mode:      'tactics',
    legsToWin: settings.legsToWin,
    players:   players.value,
  }
  const needsStarterDraw = players.value.length > 1
  router.push({ name: needsStarterDraw ? 'tactics-starter' : 'tactics-game' })
}
</script>

<template>
  <div class="settings">
    <AppHeader title="Tactics" @back="router.push({ name: 'play' })" />

    <main class="settings__main">

      <!-- Joueurs -->
      <div class="settings__card">
        <div class="settings__section-label">Joueurs</div>

        <p class="settings__hint">Glisse pour définir l'ordre des joueurs. Laisse juste "Toi" pour jouer seul.</p>

        <X01PlayerOrderList v-model="players" removable @remove="removePlayer" />

        <button v-if="canAddMore" class="settings__add-player" @click="openPicker">
          + Ajouter un joueur
        </button>
        <p v-else class="settings__hint">Maximum {{ MAX_PLAYERS }} joueurs atteint.</p>
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


    </main>

    <AppButton @click="startGame">COMMENCER</AppButton>

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
  padding: $padding-md $padding-md calc($padding-xxl + 69px);
  gap: $gap-xl;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0 auto;
    gap: $gap-md;
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

@media (min-width: $bp-tablet) {
  .settings {
    padding: $padding-xl $padding-xl calc($padding-xl + 69px);

    &__section-label  { @include title-xl; }
    &__stepper-btn    { @include title-xl; }
    &__stepper-value  { @include display-md; }
    &__hint           { @include title-md; }
  }
}
</style>
