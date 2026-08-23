<script setup>
import { computed } from 'vue'

const props = defineProps({
  // [{ name, zones: [{id,label,visits,closed}], activeZoneId, isCurrent }]
  players: { type: Array, required: true },
})

// Ordre des colonnes autour de la colonne "Zone" :
// - 2 joueurs : joueur | Zone | joueur (spine centrale)
// - 1, 3 ou 4 joueurs : Zone tout à gauche, puis les joueurs
const columns = computed(() => {
  const n = props.players.length
  const zoneCol = { type: 'zone' }
  if (n === 2) return [{ type: 'player', index: 0 }, zoneCol, { type: 'player', index: 1 }]
  return [zoneCol, ...props.players.map((_, i) => ({ type: 'player', index: i }))]
})

// Colonne "Zone" réduite au minimum, les colonnes joueurs se partagent le reste.
const gridTemplateColumns = computed(() =>
  columns.value.map(c => (c.type === 'zone' ? 'auto' : '1fr')).join(' '),
)

const headerCells = computed(() => columns.value.map(col =>
  col.type === 'zone'
    ? { type: 'zone', label: 'Zone' }
    : { type: 'player', label: props.players[col.index].name, isCurrent: props.players[col.index].isCurrent },
))

const tableRows = computed(() => {
  const zones = props.players[0]?.zones ?? []
  return zones.map((zone, rowIndex) => ({
    key: zone.id,
    cells: columns.value.map((col) => {
      if (col.type === 'zone') return { type: 'zone', label: zone.label }
      const player = props.players[col.index]
      return {
        type:   'mark',
        visits: player.zones[rowIndex].visits,
        closed: player.zones[rowIndex].closed,
        active: zone.id === player.activeZoneId,
      }
    }),
  }))
})
</script>

<template>
  <div class="tactics-board">
    <div class="tactics-board__grid" :style="{ gridTemplateColumns }">
      <div
        v-for="(h, i) in headerCells" :key="`h${i}`"
        class="tactics-board__cell tactics-board__cell--head"
        :class="{ 'tactics-board__cell--head-active': h.type === 'player' && h.isCurrent }"
      >
        {{ h.label }}
      </div>

      <template v-for="row in tableRows" :key="row.key">
        <div
          v-for="(cell, i) in row.cells" :key="i"
          class="tactics-board__cell"
          :class="cell.type === 'zone'
            ? 'tactics-board__cell--zone'
            : ['tactics-board__cell--mark', {
                'tactics-board__cell--mark-closed': cell.closed,
                'tactics-board__cell--mark-active': cell.active && !cell.closed,
              }]"
        >
          <template v-if="cell.type === 'zone'">{{ cell.label }}</template>
          <svg v-else class="tactics-board__mark" viewBox="0 0 24 24">
            <line v-if="cell.visits >= 1" x1="5" y1="5" x2="19" y2="19" />
            <line v-if="cell.visits >= 2" x1="19" y1="5" x2="5" y2="19" />
            <circle v-if="cell.visits >= 3" cx="12" cy="12" r="10" fill="none" />
          </svg>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tactics-board {
  overflow-x: auto;

  &__grid {
    display: grid;
    width: 100%;
    border: $border-sm solid $white;
  }

  &__cell {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $padding-xs;
    border: $border-sm solid $white;
    text-align: center;
  }

  &__cell--head {
    @include title-xs;
    font-weight: 700;
    color: $white;
    white-space: nowrap;
  }

  &__cell--head-active {
    color: $orange;
  }

  &__cell--zone {
    @include title-xs;
    font-weight: 700;
    color: $white;
    white-space: nowrap;
  }

  &__cell--mark-closed {
  }

  &__cell--mark-active {
    background: $orange;
  }

  &__mark {
    width: 18px;
    height: 18px;
    stroke: $white;
    stroke-width: 2.5;
    fill: none;

    .tactics-board__cell--mark-closed & {
      stroke: $accent;
    }

    .tactics-board__cell--mark-active & {
      stroke: $white;
    }
  }
}

@media (min-width: $bp-laptop) {
  .tactics-board {
    &__cell--head,
    &__cell--zone { @include title-sm; }

    &__mark {
      width: 22px;
      height: 22px;
    }
  }
}
</style>
