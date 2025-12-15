import { useMutation } from "@tanstack/react-query";
import { type AuthProfilePayload, profileApi } from "../api/profileApi";

export function useProfileAuthMutation() {
  return useMutation({
    mutationFn: (payload: AuthProfilePayload) => profileApi.auth(payload),
  });
}
