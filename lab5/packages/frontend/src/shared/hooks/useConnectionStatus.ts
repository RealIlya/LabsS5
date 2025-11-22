import { useEffect, useState } from "react";
import { API_CONFIG } from "../../shared/config/api.config";

type ConnectionState = "checking" | "online" | "offline";

interface ConnectionStatus {
  isOnline: boolean;
  status: ConnectionState;
  message?: string;
}

const HEALTH_CHECK_INTERVAL = 5000;

export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(() => {
    if (API_CONFIG.useMock || !API_CONFIG.restBaseUrl) {
      return { isOnline: true, status: "online" };
    }
    return { isOnline: false, status: "checking" };
  });

  useEffect(() => {
    if (API_CONFIG.useMock || !API_CONFIG.restBaseUrl) {
      setStatus({ isOnline: true, status: "online" });
      return undefined;
    }

    const apiBase = API_CONFIG.restBaseUrl.replace(/\/api$/, "");
    const url = `${apiBase}/status`;
    let cancelled = false;

    const checkHealth = async () => {
      try {
        const response = await fetch(url, { method: "GET" });
        if (!cancelled) {
          setStatus({
            isOnline: response.ok,
            status: response.ok ? "online" : "offline",
            message: response.ok ? undefined : undefined,
          });
        }
      } catch (error: any) {
        if (!cancelled) {
          setStatus({
            isOnline: false,
            status: "offline",
            message: error?.message,
          });
        }
      }
    };

    checkHealth();
    const interval = window.setInterval(checkHealth, HEALTH_CHECK_INTERVAL);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return status;
}
