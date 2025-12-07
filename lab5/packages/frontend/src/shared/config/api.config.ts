import { API_ENDPOINTS, API_PREFIX } from "./routes.config";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const API_CONFIG = {
  useMock: USE_MOCK,
  restBaseUrl: USE_MOCK ? "https://api.hex-strategy.local" : API_PREFIX,
  socketBaseUrl: USE_MOCK ? undefined : window.location.origin,
  endpoints: API_ENDPOINTS,
};

export type ApiConfig = typeof API_CONFIG;
