type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

const sanitizeBaseUrl = (url?: string) => (url || "").replace(/\/+$/, "");

const getApiBaseUrl = () => {
  const baseUrl = sanitizeBaseUrl(process.env.EXPO_PUBLIC_BASE_URL);
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_BASE_URL is not configured");
  }
  return baseUrl;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  const payload = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export async function fileUpload<T>(path: string, formData: FormData, token?: string | null): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const headers: Record<string, string> = {
    // Note: Do NOT set Content-Type for FormData, the browser/native fetch will set it correctly with Boundary
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  const raw = await response.text();
  const payload = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      `Upload failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}
