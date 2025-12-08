export async function request<T>(
  url: string,
  options: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const raw = await response.text();
  let parsed: unknown = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }

  if (!response.ok) {
    const message =
      (parsed as any)?.message ||
      (Array.isArray((parsed as any)?.message)
        ? (parsed as any).message.join(", ")
        : null) ||
      (typeof parsed === "string" ? parsed : null) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return parsed as T;
}
