import { apiEndpoints, apiPrefix } from "./routes.config";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const apiConfig = {
  useMock: USE_MOCK,
  restBaseUrl: USE_MOCK ? "https://api.hex-strategy.local" : apiPrefix,
  socketBaseUrl: USE_MOCK ? undefined : window.location.origin,
  endpoints: apiEndpoints,
};

export type ApiConfig = typeof apiConfig;
