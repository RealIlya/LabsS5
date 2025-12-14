import { apiConfig } from "../../../shared/config/api.config";
import { request } from "../../../shared/api/request";
import type { ProfileData } from "../model/useProfileStore";

const { restBaseUrl, endpoints } = apiConfig;

export interface AuthProfilePayload {
  nickname: string;
  password: string;
  register?: boolean;
}

export type AuthProfileResponse = Pick<ProfileData, "id" | "nickname">;

export const profileApi = {
  auth(payload: AuthProfilePayload) {
    return request<AuthProfileResponse>(
      `${restBaseUrl}${endpoints.authProfile}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },
};
