import { useQuery } from "@tanstack/react-query";
import { getGameState } from "../api/gameApi";

export function useGameState(gameId: string | null) {
  return useQuery({
    queryKey: ["game", gameId],
    enabled: Boolean(gameId),
     refetchInterval: (query) =>
       query.state.data?.phase === "capital-placement" ? 2000 : false,
    queryFn: () => {
      if (!gameId) {
        throw new Error("Game id required");
      }
      return getGameState(gameId);
    },
  });
}
