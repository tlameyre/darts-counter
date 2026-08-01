<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Array of player card data:
  // Human: { name, remaining, legsWon, legsToWin, lastDarts, avgVolley, lastScore, totalDarts, isLegStarter }
  // AI:    { name, profileLabel, level, remaining, legsWon, legsToWin, lastScore, avgVolley, totalDarts, isThinking, isAI }
  players:     { type: Array,   required: true },
  activeIndex: { type: Number,  default: 0 },
})

// 3-4 players: spotlight the active player, list the rest compactly
const isSpotlight  = computed(() => props.players.length >= 3)
const activePlayer = computed(() => props.players[props.activeIndex])
// Turn order starting right after the active player, so the next-up player sits
// at the top of the list and the one who just threw ends up at the bottom.
const otherPlayers = computed(() => {
  const n = props.players.length
  const list = []
  for (let offset = 1; offset < n; offset++) {
    const i = (props.activeIndex + offset) % n
    list.push({ ...props.players[i], _index: i })
  }
  return list
})
</script>

<template>
  <div class="split-card" :class="[`split-card--count-${players.length}`, { 'split-card--spotlight': isSpotlight }]">
    <template v-if="isSpotlight">
      <div class="split-card__half split-card__half--active split-card__spotlight">
        <div class="split-card__header">
          <div class="split-card__avatar">
            {{ activePlayer.name?.[0]?.toUpperCase() ?? '?' }}
          </div>
          <span class="split-card__name">{{ activePlayer.name }}</span>
        </div>

        <div class="split-card__score-row">
          <span class="split-card__score">{{ activePlayer.remaining }}</span>
          <span class="split-card__legs-badge">{{ activePlayer.legsWon }}</span>
        </div>

        <div class="split-card__darts">
          <template v-if="activePlayer.lastDarts?.length">
            <span v-for="(d, j) in activePlayer.lastDarts" :key="j" class="split-card__dart-chip">
              {{ d.label }}
            </span>
          </template>
          <span v-else class="split-card__dart-chip split-card__dart-chip--empty">–</span>
        </div>

        <div class="split-card__stats">
          <div class="split-card__stat-row">
            <span class="split-card__stat-label">Moyenne</span>
            <span class="split-card__stat-val">{{ activePlayer.avgVolley ?? '–' }}</span>
          </div>
          <div class="split-card__stat-row">
            <span class="split-card__stat-label">Score précédent</span>
            <span class="split-card__stat-val">{{ activePlayer.lastScore != null ? activePlayer.lastScore : '–' }}</span>
          </div>
          <div class="split-card__stat-row">
            <span class="split-card__stat-label">Fléchettes</span>
            <span class="split-card__stat-val">{{ activePlayer.totalDarts }}</span>
          </div>
        </div>
      </div>

      <div class="split-card__list">
        <div
          v-for="player in otherPlayers"
          :key="player._index"
          class="split-card__row"
        >
          <span class="split-card__row-dot" :class="{ 'split-card__row-dot--on': player.isLegStarter }" />
          <div class="split-card__avatar split-card__avatar--sm">
            {{ player.name?.[0]?.toUpperCase() ?? '?' }}
          </div>
          <span class="split-card__row-name">{{ player.name }}</span>
          <span class="split-card__legs-badge">{{ player.legsWon }}</span>
          <span class="split-card__row-score">{{ player.remaining }}</span>
        </div>
      </div>
    </template>

    <template v-else>
      <div
        v-for="(player, i) in players"
        :key="i"
        class="split-card__half"
        :class="{
          'split-card__half--active': i === activeIndex,
          'split-card__half--ai':    player.isAI,
        }"
      >
        <div class="split-card__header">
          <span class="split-card__active-dot" :class="{ 'split-card__active-dot--on': i === activeIndex }" />
          <div class="split-card__avatar" :class="{ 'split-card__avatar--ai': player.isAI }">
            {{ player.isAI ? '🤖' : (player.name?.[0]?.toUpperCase() ?? '?') }}
          </div>
          <span class="split-card__name">{{ player.isAI ? 'DartBot' : player.name }}</span>
          <span v-if="player.isAI" class="split-card__level-badge">
            {{ player.level != null ? 'Lv. ' + player.level : 'Custom' }}
          </span>
        </div>

        <div class="split-card__score-row">
          <span class="split-card__score">{{ player.remaining }}</span>
          <span class="split-card__legs-badge">{{ player.legsWon }}</span>
        </div>

        <div class="split-card__darts">
          <!-- AI thinking animation -->
          <template v-if="player.isAI && player.isThinking">
            <span class="split-card__dart-chip split-card__dart-chip--thinking">
              <span class="split-card__think-dot" />
              <span class="split-card__think-dot" />
              <span class="split-card__think-dot" />
            </span>
          </template>
          <!-- AI last score -->
          <template v-else-if="player.isAI && player.lastScore != null">
            <span class="split-card__dart-chip">{{ player.lastScore > 0 ? player.lastScore : 'MISS' }}</span>
          </template>
          <!-- Human last darts -->
          <template v-else-if="!player.isAI && player.lastDarts?.length">
            <span v-for="(d, j) in player.lastDarts" :key="j" class="split-card__dart-chip">
              {{ d.label }}
            </span>
          </template>
          <span v-else class="split-card__dart-chip split-card__dart-chip--empty">–</span>
        </div>

        <div class="split-card__stats">
          <div class="split-card__stat-row">
            <span class="split-card__stat-label">Moyenne</span>
            <span class="split-card__stat-val">{{ player.avgVolley ?? '–' }}</span>
          </div>
          <div class="split-card__stat-row">
            <span class="split-card__stat-label">Score précédent</span>
            <span class="split-card__stat-val">{{ player.lastScore != null ? player.lastScore : '–' }}</span>
          </div>
          <div class="split-card__stat-row">
            <span class="split-card__stat-label">Fléchettes</span>
            <span class="split-card__stat-val">{{ player.totalDarts }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.split-card {
  display: flex;
  border-radius: $radius-lg;
  overflow: hidden;
  flex: 1;
  overflow-y: auto;

  &__half {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    padding: $padding-md;
    background: $orange;
    transition: background 0.25s;
    height: fit-content;

    &--active { background: $orange; }
    &:not(&--active) { background: transparent; }
  }

  // First/last half border radii
  &__half:first-child { border-radius: $radius-lg 0 0 $radius-lg; }
  &__half:last-child  { border-radius: 0 $radius-lg $radius-lg 0; }
  &--count-1 &__half  { border-radius: $radius-lg; }

  // ── Spotlight layout (3-4 players) ──────────────────────────────────────
  &--spotlight {
    flex-direction: row;
    gap: $gap-sm;
  }

  &--spotlight &__spotlight {
    flex: 1;
    border-radius: $radius-lg;
    min-width: 0;
  }

  &__list {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0;
    border-radius: $radius-lg;
    padding: $padding-xs $padding-sm;
    min-width: 0;
    overflow-y: auto;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    padding: $padding-xs 0;
    border-bottom: 1px solid rgba($white, 0.12);
    min-width: 0;
    flex: 1;

    &:last-child { border-bottom: none; }
  }

  &__row-dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-pill;
    background: transparent;
    flex-shrink: 0;

    &--on { background: $white; }
  }

  &__row-name {
    @include text-xs;
    font-weight: 600;
    color: rgba($white, 0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  &__row-score {
    @include title-sm;
    font-weight: 700;
    color: $white;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  // ── Header ───────────────────────────────────────────────────────────────
  &__header {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    min-width: 0;
  }

  &__active-dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-pill;
    background: rgba($white, 0.3);
    flex-shrink: 0;
    transition: background 0.2s;

    &--on { background: $white; }
  }

  &__avatar {
    width: 28px;
    height: 28px;
    border-radius: $radius-pill;
    background: rgba($white, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-xs;
    font-weight: 700;
    color: $white;
    flex-shrink: 0;

    &--ai { font-size: 16px; }
    &--sm {
      width: 22px;
      height: 22px;
      @include title-xxs;
    }
  }

  &__name {
    @include text-sm;
    font-weight: 600;
    color: rgba($white, 0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  &__level-badge {
    @include text-xs;
    font-weight: 700;
    background: rgba($white, 0.2);
    color: $white;
    border-radius: $radius-pill;
    padding: 3px 8px;
    flex-shrink: 0;
  }

  // ── Score ─────────────────────────────────────────────────────────────────
  &__score-row {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    flex: 1;
  }

  &__score {
    @include display-md;
    font-weight: 700;
    color: $white;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    transition: color 0.2s;
  }

  &__legs-badge {
    @include title-sm;
    font-weight: 700;
    color: $white;
    background: rgba($black, 0.7);
    border-radius: $radius-sm;
    padding: 4px 10px;
    flex-shrink: 0;
  }

  // ── Darts chips ───────────────────────────────────────────────────────────
  &__darts {
    display: flex;
    gap: $gap-xxs;
    flex-wrap: wrap;
  }

  &__dart-chip {
    background: rgba($black, 0.5);
    border-radius: $radius-sm;
    padding: 3px 9px;
    @include title-xs;
    font-weight: 700;
    color: $white;

    &--empty    { color: rgba($white, 0.4); background: rgba($black, 0.3); }
    &--thinking {
      display: flex;
      gap: 3px;
      align-items: center;
      background: rgba($black, 0.3);
      padding: 6px 10px;
    }
  }

  &__think-dot {
    width: 4px;
    height: 4px;
    border-radius: $radius-pill;
    background: rgba($white, 0.8);
    animation: think-blink 1.2s infinite ease-in-out;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  &__stats {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  &__stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__stat-label {
    @include text-xs;
    color: rgba($white, 0.7);
  }

  &__stat-val {
    @include title-md;
    font-weight: 700;
    color: $white;
    font-variant-numeric: tabular-nums;
  }
}

@keyframes think-blink {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40%           { opacity: 1;   transform: scale(1.1); }
}

@media (min-width: $bp-tablet) {
  .split-card {
    flex-direction: column;

    &__half:first-child { border-radius: $radius-lg $radius-lg 0 0; }
    &__half:last-child  { border-radius: 0 0 $radius-lg $radius-lg; }
    &--count-1 &__half  { border-radius: $radius-lg; }

    &__name       { @include text-md; }
    &__score      { @include display-md; }
    &__stat-label { @include text-sm; }
    &__stat-val   { @include title-lg; }
    &__dart-chip  { @include title-sm; padding: 4px 10px; }

    // Spotlight layout stays row-based (doesn't stack like the 1-2 player halves)
    &--spotlight              { flex-direction: row; }
    &--spotlight &__spotlight { border-radius: $radius-lg; }
    &--spotlight &__list      { border-radius: $radius-lg; }
    &__row-name  { @include text-sm; }
    &__row-score { @include title-md; }
  }
}

@media (min-width: $bp-laptop) {
  .split-card {
    &__half        { padding: $padding-md $padding-lg; }
    &__avatar      { width: 40px; height: 40px; }
    &__avatar--sm  { width: 24px; height: 24px; }
    &__name        { @include text-lg; }
    &__score       { @include display-lg; }
    &__stat-label  { @include text-md; }
    &__stat-val    { @include title-xxl; }
    &__dart-chip   { @include title-md; padding: 5px 12px; }
    &__row-name    { @include text-md; }
    &__row-score   { @include title-lg; }
  }
}
</style>
