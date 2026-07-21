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
    settingsRoute: "score-settings",
  },
  {
    id: "warmup",
    title: "ECHAUFFEMENT",
    description:
      "Travaille une zone de la cible sur une durée définie et suis ta précision.",
    color: "#1D4ED8",
    settingsRoute: "warmup-settings",
  },
  {
    id: "x01",
    title: "501",
    description:
      "Descends de 501 (ou 301) à 0 en comptant tes volées. Analyse tes moyennes et tes checkouts.",
    color: "#047857",
    settingsRoute: "x01-settings",
  },
];
