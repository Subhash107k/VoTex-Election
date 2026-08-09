export class ApiError extends Error {
  status: number;
  code?: string;
  field?: string;
  retryAfter?: number;
  details: unknown;

  constructor(message: string, status: number, details?: any, retryAfter?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.retryAfter = retryAfter;
    if (details && typeof details === "object") {
      this.code = details.code;
      this.field = details.field;
      if (!this.retryAfter && details.retryAfter) {
        this.retryAfter = Number(details.retryAfter);
      }
    }
  }
}

type ApiResponseBody<T> = T & {
  error?: string;
  message?: string;
  retryAfter?: number;
};

const getConfiguredApiBaseUrl = () => {
  const importMetaEnv = (
    import.meta as ImportMeta & { env?: Record<string, string | undefined> }
  ).env;
  const envApiBaseUrl =
    importMetaEnv?.VITE_API_BASE_URL ||
    importMetaEnv?.VITE_API_URL ||
    (typeof process !== "undefined" && process.env
      ? process.env.VITE_API_BASE_URL || process.env.VITE_API_URL || ""
      : "");

  if (envApiBaseUrl) return envApiBaseUrl.replace(/\/$/, "");
  return "";
};

export function buildApiUrl(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path) || path.startsWith("//")) {
    return path;
  }

  const baseUrl = getConfiguredApiBaseUrl();
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function requestJson<T>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResponseBody<T>> {
  // Ensure headers exist and inject a dev bypass header for local development
  const headers = new Headers(options.headers || {});
  try {
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");
    const hasAuth =
      headers.get("authorization") || headers.get("Authorization");
    if (isLocalhost && !hasAuth) {
      headers.set("x-votex-dev-bypass", "true");
    }
    try {
      // If a dev user override is stored in localStorage, forward it to the server
      if (typeof window !== "undefined" && (window as any).localStorage) {
        const devUser = (window as any).localStorage.getItem("votex_dev_user");
        if (devUser) headers.set("x-votex-dev-user", devUser);
      }
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore
  }
  options = { ...options, headers };

  const response = await fetch(buildApiUrl(url), options);
  const data = (await response.json().catch(() => ({}))) as ApiResponseBody<T>;

  if (!response.ok) {
    const retryAfterHeader = response.headers.get("retry-after");
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : data.retryAfter;
    throw new ApiError(
      data.error || data.message || "Something went wrong. Please try again.",
      response.status,
      data,
      retryAfter,
    );
  }

  return data;
}

export function jsonRequestOptions(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export function authHeader(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
