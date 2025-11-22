export const MAP_COLUMNS = 18;
export const MAP_ROWS = 14;
export const PLAYER_COLORS = ["#5FB49C", "#FFB347", "#6C63FF", "#FF6F91"];

export const CITY_MAX_FORTIFICATION = 100;
export const CITY_FORT_REGEN = 10;
export const CAPITAL_START_POPULATION = 30;
export const CAPITAL_START_FORTIFICATION = 80;
export const CITY_POPULATION_CAP_BONUS = 50;

export const EVEN_NEIGHBORS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: -1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 1, dy: 1 },
];

export const ODD_NEIGHBORS = [
  { dx: -1, dy: -1 },
  { dx: 0, dy: -1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
  { dx: -1, dy: 1 },
  { dx: 0, dy: 1 },
];
