/**
 * Définition des modes de jeu.
 * Pour ajouter un mode : ajouter un objet ici + les routes dans router/index.js
 */
export const GAME_MODES = [
  {
    id: "score-training",
    title: "ENTRAINEMENT\nCALCUL",
    description:
      "Calcule le total de ta volée et entraîne-toi à compter rapidement.",
    color: "#EB6343",
    icon: "calculator",
    settingsRoute: "score-settings",
  },
  {
    id: "warmup",
    title: "ECHAUFFEMENT",
    description:
      "Travaille une zone de la cible sur une durée définie et suis ta précision.",
    color: "#1D4ED8",
    icon: "dartboard",
    settingsRoute: "warmup-settings",
  },
  {
    id: "x01",
    title: "501",
    description:
      "Descends de 501 (ou 301) à 0 en comptant tes volées. Analyse tes moyennes et tes checkouts.",
    color: "#047857",
    icon: "dartboard",
    settingsRoute: "x01-settings",
  },
  {
    id: "tactics",
    title: "TACTICS",
    description:
      "Ferme les zones 20 à 12 puis Double, Triple et Bull, le plus vite possible. Façon cricket.",
    color: "#DC2626",
    icon: "cricket-closed",
    settingsRoute: "tactics-settings",
  },
  {
    id: "tournament",
    title: "TOURNOI",
    description:
      "Affronte un groupe de joueurs en bracket à élimination directe et suis la progression jusqu'au vainqueur.",
    color: "#7C3AED",
    icon: "trophy",
    settingsRoute: "tournaments",
  },
];
