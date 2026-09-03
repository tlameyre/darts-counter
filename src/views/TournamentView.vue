<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTournamentStore } from '../store/tournamentStore.js'
import { useFriendStore } from '../store/friendStore.js'
import { useAuthStore } from '../store/authStore.js'
import { useGameStore } from '../store/gameStore.js'
import { MIN_PARTICIPANTS_TO_START } from '../data/tournamentConstants.js'
import AppHeader from '../components/AppHeader.vue'
import AppTabs from '../components/AppTabs.vue'
import AppButton from '../components/AppButton.vue'
import AppIcon from '../components/AppIcon.vue'
import TournamentBracketTree from '../components/tournament/TournamentBracketTree.vue'
import TournamentStartModal from '../components/tournament/TournamentStartModal.vue'
import TournamentHostPickerModal from '../components/tournament/TournamentHostPickerModal.vue'
import X01PlayerPicker from '../components/x01/X01PlayerPicker.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

const props = defineProps({
  // Preview /dev uniquement : { tournament, hosts, participants, matches }
  mockTournament: { type: Object, default: null },
})

const route           = useRoute()
const router           = useRouter()
const tournamentStore  = useTournamentStore()
const friendStore      = useFriendStore()
const authStore        = useAuthStore()
const gameStore        = useGameStore()

const isMock = computed(() => props.mockTournament !== null)
const data   = computed(() => isMock.value ? props.mockTournament : tournamentStore.activeTournament)
const isHost = computed(() => isMock.value ? true : tournamentStore.isHost)

const TABS = [
  { id: 'infos',        label: 'Infos' },
  { id: 'participants',  label: 'Participants' },
  { id: 'bracket',       label: 'Bracket' },
]
const activeTab = ref('infos')

const showStartModal      = ref(false)
const showHostPicker      = ref(false)
const showAddPlayerPicker = ref(false)
const showDeleteConfirm   = ref(false)
const participantToRemove = ref(null)
const deleting            = ref(false)

onMounted(() => {
  if (!isMock.value) {
    tournamentStore.fetchTournamentDetail(route.params.id)
    tournamentStore.markTournamentSeen(route.params.id)
    tournamentStore.subscribeToTournamentDetail(route.params.id, {
      onDeleted: () => router.push({ name: 'tournaments' }),
    })
  }
})

onUnmounted(() => {
  if (!isMock.value) tournamentStore.unsubscribeFromTournamentDetail()
})

function openHostPicker() {
  if (!friendStore.friends.length) friendStore.fetchFriends()
  showHostPicker.value = true
}
function openAddPlayerPicker() {
  if (!friendStore.friends.length) friendStore.fetchFriends()
  showAddPlayerPicker.value = true
}

// Résout un nom affichable pour chaque hôte via le profil connecté ou, à défaut,
// via une ligne participant correspondante (le créateur est toujours les deux).
const resolvedHosts = computed(() => {
  const t = data.value
  if (!t) return []
  return t.hosts.map(h => {
    const asParticipant = t.participants.find(p => p.user_id === h.user_id)
    const isMe = h.user_id === authStore.user?.id
    return {
      user_id: h.user_id,
      role:    h.role,
      name:    isMe ? (authStore.profile?.username ?? 'Toi') : (asParticipant?.player_data?.name ?? 'Hôte'),
    }
  })
})

// Édition du nom (hôte uniquement) : sauvegarde au blur, resynchronisé
// depuis les données serveur tant que l'utilisateur n'a pas de saisie en cours.
const nameDraft = ref('')
watch(() => data.value?.tournament?.name, (name) => {
  if (name != null) nameDraft.value = name
}, { immediate: true })

async function saveNameIfChanged() {
  const trimmed = nameDraft.value.trim()
  const current = data.value?.tournament?.name ?? ''
  if (!trimmed || trimmed === current) {
    nameDraft.value = current
    return
  }
  if (isMock.value) return
  await tournamentStore.updateTournamentName(data.value.tournament.id, trimmed)
}

const hostUserIds = computed(() => resolvedHosts.value.map(h => h.user_id))
const canStart     = computed(() => (data.value?.participants.length ?? 0) >= MIN_PARTICIPANTS_TO_START)

const inviteLink = computed(() => {
  const t = data.value
  if (!t?.tournament.join_code) return ''
  const resolved = router.resolve({ name: 'tournament-join', params: { code: t.tournament.join_code } })
  return `${window.location.origin}${resolved.href}`
})
const copied = ref(false)
async function copyInviteLink() {
  if (!inviteLink.value) return
  await navigator.clipboard.writeText(inviteLink.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}

async function onStartConfirm({ seedingMethod, doubleElimination }) {
  showStartModal.value = false
  await tournamentStore.startTournament({
    tournamentId: data.value.tournament.id,
    seedingMethod,
    doubleElimination,
  })
  activeTab.value = 'bracket'
}

function onAddHost(friend) {
  showHostPicker.value = false
  tournamentStore.addHost(data.value.tournament.id, friend.id)
}
function onRemoveHost(userId) {
  tournamentStore.removeHost(data.value.tournament.id, userId)
}
function askRemoveParticipant(participant) {
  participantToRemove.value = participant
}
function confirmRemoveParticipant() {
  if (participantToRemove.value) {
    tournamentStore.removeParticipant(data.value.tournament.id, participantToRemove.value.id)
  }
  participantToRemove.value = null
}

async function confirmDeleteTournament() {
  if (deleting.value) return
  deleting.value = true
  const ok = await tournamentStore.deleteTournament(data.value.tournament.id)
  deleting.value = false
  showDeleteConfirm.value = false
  if (ok) router.push({ name: 'tournaments' })
}
function onAddPlayers(newPlayers) {
  showAddPlayerPicker.value = false
  for (const p of newPlayers) {
    tournamentStore.addGuestParticipant(data.value.tournament.id, p)
  }
}

const winnerName = computed(() => {
  const t = data.value
  if (!t?.tournament?.winner_participant_id) return null
  return t.participants.find(p => p.id === t.tournament.winner_participant_id)?.player_data?.name ?? null
})

function onPlay(matchId) {
  if (isMock.value) return
  const settings = tournamentStore.buildGameSettingsForMatch(matchId)
  if (!settings) return
  gameStore.gameSettings = settings
  router.push({ name: 'x01-game' })
}
</script>

<template>
  <div class="tournament" v-if="data">
    <AppHeader :title="data.tournament.name" @back="router.push({ name: 'tournaments' })" />

    <AppTabs v-model="activeTab" :tabs="TABS" />

    <main class="tournament__main">

      <!-- ── Infos ────────────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'infos'" class="tournament__tab">
        <div v-if="winnerName" class="tournament__winner">
          <div class="tournament__winner-trophy">🏆</div>
          <div class="tournament__winner-name">{{ winnerName }}</div>
          <div class="tournament__winner-sub">remporte le tournoi !</div>
        </div>

        <p v-if="data.tournament.description" class="tournament__description">{{ data.tournament.description }}</p>

        <div class="tournament__info-row">
          <span class="tournament__info-label">Nom</span>
          <input
            v-if="isHost"
            v-model="nameDraft"
            class="tournament__info-input"
            maxlength="60"
            @blur="saveNameIfChanged"
            @keydown.enter="$event.target.blur()"
          />
          <span v-else class="tournament__info-value">{{ data.tournament.name }}</span>
        </div>
        <div class="tournament__info-row">
          <span class="tournament__info-label">Format de match</span>
          <span class="tournament__info-value">{{ data.tournament.start_score }} · {{ data.tournament.legs_to_win }} manche(s)</span>
        </div>
        <div class="tournament__info-row">
          <span class="tournament__info-label">Hôtes</span>
          <span class="tournament__info-value">{{ resolvedHosts.map(h => h.name).join(', ') }}</span>
        </div>

        <template v-if="data.tournament.status === 'pending'">
          <p v-if="!canStart" class="tournament__banner">
            Minimum {{ MIN_PARTICIPANTS_TO_START }} participants pour démarrer ({{ data.participants.length }}/{{ MIN_PARTICIPANTS_TO_START }}).
          </p>

          <div class="tournament__invite">
            <span class="tournament__invite-label">Code d'invitation</span>
            <button class="tournament__invite-code" @click="copyInviteLink">
              {{ data.tournament.join_code }}
              <AppIcon name="copy" :width="14" :height="14" />
            </button>
            <span v-if="copied" class="tournament__invite-copied">Lien copié !</span>
          </div>

          <AppButton v-if="isHost" :disabled="!canStart" @click="showStartModal = true">
            Démarrer le tournoi
          </AppButton>
        </template>

        <button v-if="isHost" class="tournament__delete-action" @click="showDeleteConfirm = true">
          <AppIcon name="trash" :width="16" :height="16" />
          Supprimer le tournoi
        </button>
      </div>

      <!-- ── Participants ─────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'participants'" class="tournament__tab">
        <div class="tournament__section">
          <div class="tournament__section-header">
            <span class="tournament__section-title">Hôtes ({{ resolvedHosts.length }})</span>
            <button v-if="isHost" class="tournament__section-action" @click="openHostPicker">+ Ajouter un hôte</button>
          </div>
          <div class="tournament__list">
            <div v-for="h in resolvedHosts" :key="h.user_id" class="tournament__row">
              <div class="tournament__avatar">{{ h.name?.[0]?.toUpperCase() }}</div>
              <span class="tournament__row-name">{{ h.name }}</span>
              <span v-if="h.role === 'creator'" class="tournament__row-tag">Créateur</span>
              <button
                v-if="isHost && h.role !== 'creator' && h.user_id !== authStore.user?.id"
                class="tournament__row-manage"
                @click="onRemoveHost(h.user_id)"
              >Retirer</button>
            </div>
          </div>
        </div>

        <div class="tournament__section">
          <div class="tournament__section-header">
            <span class="tournament__section-title">Participants ({{ data.participants.length }})</span>
            <button v-if="isHost && data.tournament.status === 'pending'" class="tournament__section-action" @click="openAddPlayerPicker">+ Ajouter</button>
          </div>
          <div class="tournament__list tournament__list--scroll">
            <div v-for="p in data.participants" :key="p.id" class="tournament__row">
              <div class="tournament__avatar">{{ p.player_data?.name?.[0]?.toUpperCase() }}</div>
              <span class="tournament__row-name">{{ p.player_data?.name }}</span>
              <button
                v-if="isHost && data.tournament.status === 'pending' && !hostUserIds.includes(p.user_id)"
                class="tournament__row-manage"
                @click="askRemoveParticipant(p)"
              >Retirer</button>
            </div>
          </div>
        </div>

        <template v-if="isHost && data.tournament.status === 'pending'">
          <p v-if="!canStart" class="tournament__banner">
            Minimum {{ MIN_PARTICIPANTS_TO_START }} participants pour démarrer ({{ data.participants.length }}/{{ MIN_PARTICIPANTS_TO_START }}).
          </p>
          <AppButton :disabled="!canStart" @click="showStartModal = true">
            Démarrer le tournoi
          </AppButton>
        </template>
      </div>

      <!-- ── Bracket ──────────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'bracket'" class="tournament__tab">
        <p v-if="data.tournament.status === 'pending'" class="tournament__empty">
          Le tournoi n'a pas encore démarré.
        </p>
        <TournamentBracketTree
          v-else
          :matches="data.matches"
          :participants="data.participants"
          @play="onPlay"
        />
      </div>

    </main>

    <TournamentStartModal
      :show="showStartModal"
      :participant-count="data.participants.length"
      @close="showStartModal = false"
      @confirm="onStartConfirm"
    />
    <TournamentHostPickerModal
      :show="showHostPicker"
      :friends="friendStore.friends"
      :excluded-ids="hostUserIds"
      @close="showHostPicker = false"
      @select="onAddHost"
    />
    <X01PlayerPicker
      :show="showAddPlayerPicker"
      :friends="friendStore.friends"
      :selected-ids="data.participants.map(p => p.player_data?.id).filter(Boolean)"
      @close="showAddPlayerPicker = false"
      @select="onAddPlayers"
    />
    <ConfirmModal
      :show="!!participantToRemove"
      title="Retirer ce participant"
      :message="`${participantToRemove?.player_data?.name ?? 'Ce joueur'} sera retiré du tournoi.`"
      confirm-label="Retirer"
      @close="participantToRemove = null"
      @confirm="confirmRemoveParticipant"
    />
    <ConfirmModal
      :show="showDeleteConfirm"
      title="Supprimer le tournoi"
      message="Cette action est définitive : le tournoi, ses participants et ses matchs seront supprimés pour tout le monde."
      :confirm-label="deleting ? 'Suppression...' : 'Supprimer'"
      @close="showDeleteConfirm = false"
      @confirm="confirmDeleteTournament"
    />
  </div>
  <div v-else class="tournament__loading">Chargement du tournoi…</div>
</template>

<style lang="scss" scoped>
.tournament {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-md $padding-md 0;
  gap: $gap-md;
  @include nav-safe-bottom;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: $padding-md 0;
  }

  &__tab {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
  }

  &__winner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xs;
    padding: $padding-lg;
    background: rgba($orange, 0.1);
    border: $border-sm solid rgba($orange, 0.3);
    border-radius: $radius-md;
  }

  &__winner-trophy { font-size: 40px; line-height: 1; }
  &__winner-name   { @include title-lg; font-weight: 700; color: $orange; }
  &__winner-sub    { @include text-sm; color: $muted; }

  &__description {
    @include text-sm;
    color: $muted;
  }

  &__info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $padding-sm 0;
    border-bottom: $border-sm solid rgba($white, 0.08);
  }

  &__info-label { @include text-sm; color: $muted; }
  &__info-value { @include text-sm; color: $text-color; font-weight: 600; }

  &__info-input {
    @include text-sm;
    flex: 1;
    min-width: 0;
    margin-left: $gap-md;
    color: $text-color;
    font-weight: 600;
    font-family: inherit;
    text-align: right;
    background: transparent;
    border: none;
    border-bottom: $border-sm solid transparent;
    padding: 2px 0;

    &:focus {
      outline: none;
      border-bottom-color: $orange;
    }
  }

  &__banner {
    @include text-sm;
    color: $orange;
    background: rgba($orange, 0.1);
    border-radius: $radius-md;
    padding: $padding-sm $padding-md;
  }

  &__invite {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__invite-label {
    @include text-sm;
    color: $muted;
  }

  &__invite-code {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    @include title-md;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: $text-color;
    background: rgba($white, 0.05);
    border: $border-sm dashed rgba($white, 0.2);
    border-radius: $radius-md;
    padding: $padding-md;
  }

  &__invite-copied {
    @include text-xs;
    color: $orange;
    text-align: center;
  }

  &__delete-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    @include text-sm;
    color: $error;
    padding: $padding-sm 0;

    &:active { opacity: 0.7; }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__section-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__section-action {
    @include text-sm;
    color: $orange;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__list--scroll {
    max-height: 340px;
    overflow-y: auto;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm $padding-md;
    border-radius: $radius-md;
    background: rgba($white, 0.05);
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: $radius-pill;
    background: $orange;
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-xs;
    font-weight: 700;
    color: $white;
    flex-shrink: 0;
  }

  &__row-name {
    flex: 1;
    @include text-sm;
    font-weight: 600;
    color: $text-color;
  }

  &__row-tag {
    @include text-xs;
    color: $muted;
    background: rgba($white, 0.08);
    border-radius: $radius-pill;
    padding: 2px 8px;
  }

  &__row-manage {
    @include text-xs;
    color: $error;
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-xl 0;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    @include text-md;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .tournament {
    padding: $padding-xl $padding-xl 0;
    gap: $gap-lg;
    @include nav-safe-bottom($padding-xl);

    &__main { padding: $padding-lg 0; }
    &__winner-name { @include title-xl; }
    &__winner-sub  { @include text-md; }
    &__description { @include text-md; }
  }
}
</style>
