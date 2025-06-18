// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function getApiUrl(path: string): string {
  // If we have a base URL, use it, otherwise use relative path
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
}

// Helper function to make API requests with proper base URL
export async function apiRequest(
  method: string,
  path: string,
  data?: unknown | undefined,
): Promise<Response> {
  const url = getApiUrl(path);
  const token = localStorage.getItem('authToken') || 'demo-token';
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
  };
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  console.log(`Making API request: ${method} ${url}`);
  console.log('Headers:', headers);
  if (data) {
    console.log('Request data:', data);
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`Response status: ${res.status}`);
    console.log('Response headers:', Object.fromEntries(res.headers.entries()));

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      console.error(`API request failed: ${res.status}: ${text}`);
      throw new Error(`${res.status}: ${text}`);
    }
    
    return res;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
} 