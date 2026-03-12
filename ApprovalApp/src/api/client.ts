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

  console.log(`>>> [CLIENT] Uploading to: ${url}`);
  
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    const raw = await response.text();
    console.log(`>>> [CLIENT] Server response (${response.status}):`, raw);
    
    let payload;
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error(">>> [CLIENT] Failed to parse response as JSON");
      throw new Error(`Server returned non-JSON response: ${raw.slice(0, 100)}`);
    }

    if (!response.ok) {
      const message = payload?.message || payload?.details || payload?.error || `Upload failed (${response.status})`;
      throw new Error(message);
    }

    return payload as T;
  } catch (error: any) {
    console.error(">>> [CLIENT] Network Error:", error);
    // Specifically catch network request failed which usually means unreachable or DNS
    if (error.message === 'Network request failed') {
      throw new Error(`Cannot reach server at ${baseUrl}. Please check your connection and server URL.`);
    }
    throw error;
  }
}
