export interface PlayerData {
  id: string;
  name: string;
  color: string;
  populationCap: number;
  currentPopulation: number;
  status: "playing" | "defeated";
  capitalCityId: string;
}

export interface PlayerProfile {
  id: string;
  nickname: string;
  rank: string;
  avatarUrl?: string;
  status?: "online" | "offline";
}
