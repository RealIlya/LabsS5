import { useMutation } from "@tanstack/react-query";
import { profileApi, type AuthProfilePayload } from "../api/profileApi";

export function useProfileAuthMutation() {
  return useMutation({
    mutationFn: (payload: AuthProfilePayload) => profileApi.auth(payload),
  });
}
