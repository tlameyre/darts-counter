<script setup>
import { computed } from 'vue'
import TournamentMatchCard from './TournamentMatchCard.vue'

const props = defineProps({
  matches:      { type: Array, required: true },
  participants: { type: Array, required: true },
})

const emit = defineEmits(['play'])

const participantsById = computed(() => Object.fromEntries(props.participants.map(p => [p.id, p])))

function groupRounds(type) {
  const byRound = {}
  for (const m of props.matches) {
    if (m.bracket_type !== type) continue
    byRound[m.round] = byRound[m.round] || []
    byRound[m.round].push(m)
  }
  return Object.keys(byRound)
    .sort((a, b) => a - b)
    .map(r => byRound[r].sort((a, b) => a.slot_in_round - b.slot_in_round))
}

const winnerRounds = computed(() => groupRounds('winner'))
const loserRounds  = computed(() => groupRounds('loser'))
const grandFinal   = computed(() => props.matches.find(m => m.bracket_type === 'grand_final') ?? null)

function roundLabel(rounds, idx) {
  const fromEnd = rounds.length - 1 - idx
  if (fromEnd === 0) return 'Finale'
  if (fromEnd === 1) return 'Demi-finale'
  if (fromEnd === 2) return 'Quart de finale'
  return `Tour ${idx + 1}`
}
</script>

<template>
  <div class="bracket">
    <section class="bracket__section">
      <div v-if="loserRounds.length" class="bracket__section-title">Tableau principal</div>
      <div class="bracket__row">
        <div v-for="(round, ri) in winnerRounds" :key="`w-${ri}`" class="bracket__col">
          <div class="bracket__col-title">{{ roundLabel(winnerRounds, ri) }}</div>
          <div class="bracket__col-matches">
            <div v-for="match in round" :key="match.id" class="bracket__node">
              <TournamentMatchCard :match="match" :participants-by-id="participantsById" @play="emit('play', match.id)" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="loserRounds.length" class="bracket__section">
      <div class="bracket__section-title">Tableau des perdants</div>
      <div class="bracket__row">
        <div v-for="(round, ri) in loserRounds" :key="`l-${ri}`" class="bracket__col">
          <div class="bracket__col-title">Tour {{ ri + 1 }}</div>
          <div class="bracket__col-matches">
            <div v-for="match in round" :key="match.id" class="bracket__node">
              <TournamentMatchCard :match="match" :participants-by-id="participantsById" @play="emit('play', match.id)" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="grandFinal" class="bracket__section">
      <div class="bracket__section-title">Grande finale</div>
      <TournamentMatchCard :match="grandFinal" :participants-by-id="participantsById" @play="emit('play', grandFinal.id)" />
    </section>
  </div>
</template>

<style lang="scss" scoped>
.bracket {
  display: flex;
  flex-direction: column;
  gap: $gap-xl;
  overflow-x: auto;
  padding-bottom: $padding-sm;

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__section-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__row {
    display: flex;
    align-items: stretch;
    gap: $gap-xl;
    min-width: max-content;
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    min-width: 168px;
  }

  &__col-title {
    @include text-xs;
    color: $muted;
    text-align: center;
  }

  &__col-matches {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    gap: $gap-sm;
  }

  &__node {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 100%;
      width: $gap-xl;
      height: 1px;
      background: rgba($white, 0.15);
    }
  }

  &__col:last-child &__node::after {
    display: none;
  }
}
</style>
