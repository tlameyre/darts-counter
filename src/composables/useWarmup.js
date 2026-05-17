import { ref, computed } from "vue";

export function formatZoneLabel(zone) {
  if (!zone) return "";
  if (zone.sector === null) {
    if (zone.type === "B") return "Bull (50)";
    if (zone.type === "SB") return "Outer (25)";
    return "Bull (tout)";
  }
  const types = { S: "Simple", D: "Double", T: "Triple", A: "" };
  return `${types[zone.type]} ${zone.sector}`;
}

function zonesMatch(z1, z2) {
  return z1?.sector === z2?.sector && z1?.type === z2?.type;
}

function isHit(dart, zone) {
  if (!zone || dart.type === "miss") return false;
  if (zone.sector === null) {
    if (zone.type === "AB") return dart.type === "bull";
    return (
      dart.type === "bull" &&
      (zone.type === "B" ? dart.pts === 50 : dart.pts === 25)
    );
  }
  if (zone.type === "A")
    return (
      ["single", "double", "triple"].includes(dart.type) &&
      dart.sector === zone.sector
    );
  const typeMap = { S: "single", D: "double", T: "triple" };
  return dart.type === typeMap[zone.type] && dart.sector === zone.sector;
}

export function useWarmup({ duration, zone: initialZone }) {
  const darts = ref([]);
  const currentZone = ref({ ...initialZone });
  const periods = ref([]);
  const timeLeft = ref(duration !== null ? duration * 60 : null);
  const gameOver = ref(false);
  let _timer = null;

  const timeDisplay = computed(() => {
    if (timeLeft.value === null) return "∞";
    const m = Math.floor(timeLeft.value / 60);
    const s = timeLeft.value % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  });

  const isUrgent = computed(
    () => timeLeft.value !== null && timeLeft.value <= 30 && timeLeft.value > 0,
  );

  const currentZoneStats = computed(() => {
    const zd = darts.value.filter((d) => zonesMatch(d.zone, currentZone.value));
    const hits = zd.filter((d) => isHit(d, currentZone.value)).length;
    return {
      total: zd.length,
      hits,
      accuracy: zd.length > 0 ? Math.round((hits / zd.length) * 100) : 0,
    };
  });

  const zoneRecapStats = computed(() => {
    const seen = [];
    periods.value.forEach((p) => {
      if (!seen.find((z) => zonesMatch(z, p.zone))) seen.push(p.zone);
    });
    return seen.map((zone) => {
      const zd = darts.value.filter((d) => zonesMatch(d.zone, zone));
      const hits = zd.filter((d) => isHit(d, zone)).length;
      const durationMs = periods.value
        .filter((p) => zonesMatch(p.zone, zone))
        .reduce((sum, p) => sum + ((p.endTs ?? Date.now()) - p.startTs), 0);
      return {
        zone,
        total: zd.length,
        hits,
        accuracy: zd.length > 0 ? Math.round((hits / zd.length) * 100) : 0,
        durationMs,
      };
    });
  });

  const sessionStats = computed(() => {
    const total = darts.value.length;
    const hits = darts.value.filter((d) => isHit(d, d.zone)).length;
    return {
      total,
      hits,
      accuracy: total > 0 ? Math.round((hits / total) * 100) : 0,
    };
  });

  function recordDart(dart) {
    if (gameOver.value) return;
    darts.value.push({
      ...dart,
      zone: { ...currentZone.value },
      ts: Date.now(),
    });
  }

  function undoLast() {
    if (gameOver.value || darts.value.length === 0) return;
    darts.value.pop();
  }

  function changeZone(newZone) {
    const now = Date.now();
    if (periods.value.length > 0)
      periods.value[periods.value.length - 1].endTs = now;
    periods.value.push({ zone: { ...newZone }, startTs: now, endTs: null });
    currentZone.value = { ...newZone };
  }

  function startTimer() {
    const now = Date.now();
    periods.value.push({
      zone: { ...currentZone.value },
      startTs: now,
      endTs: null,
    });
    if (timeLeft.value === null) return;
    clearInterval(_timer);
    _timer = setInterval(() => {
      timeLeft.value--;
      if (timeLeft.value <= 0) {
        clearInterval(_timer);
        _closePeriod();
        gameOver.value = true;
      }
    }, 1000);
  }

  function endSession() {
    clearInterval(_timer);
    _closePeriod();
    gameOver.value = true;
  }

  function _closePeriod() {
    const last = periods.value[periods.value.length - 1];
    if (last && !last.endTs) last.endTs = Date.now();
  }

  function cleanup() {
    clearInterval(_timer);
  }

  return {
    darts,
    currentZone,
    gameOver,
    timeDisplay,
    isUrgent,
    currentZoneStats,
    zoneRecapStats,
    sessionStats,
    recordDart,
    undoLast,
    changeZone,
    startTimer,
    endSession,
    cleanup,
  };
}
