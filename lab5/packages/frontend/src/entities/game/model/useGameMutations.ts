import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlayerAction } from "@hex/shared";
import { placeCapital, submitAction } from "../api/gameApi";

export function useGameMutations(
  gameId: string | null,
  playerId: string | null
) {
  const queryClient = useQueryClient();

  const placeCapitalMutation = useMutation({
    mutationFn: (tileId: string) => {
      if (!gameId || !playerId) throw new Error("Missing identifiers");
      return placeCapital({ gameId, tileId, playerId });
    },
    onSuccess: () => {
      if (gameId) {
        queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      }
    },
  });

  const submitActionMutation = useMutation({
    mutationFn: (action: PlayerAction) => {
      if (!gameId || !playerId) {
        throw new Error("Missing identifiers for action");
      }
      return submitAction({ gameId, playerId, action });
    },
    onSuccess: (data) => {
      if (gameId) {
        queryClient.setQueryData(["game", gameId], data);
      }
    },
  });

  return { placeCapitalMutation, submitActionMutation };
}
