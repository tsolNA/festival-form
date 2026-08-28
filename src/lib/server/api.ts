import { env } from "$env/dynamic/private";
import { errorMessage } from "../stores";

export async function apiRequest<T>(
  url: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
  bodyData?: Record<string, any>,
  strict?: boolean
): Promise<T | null> {
  try {
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Body only exists on non-GET calls
    if (method !== 'GET' && bodyData) {
      config.body = JSON.stringify(bodyData);
    }

    const response = await fetch(env.TESSITURA_TEST_ENDPOINT + url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    // if response empty, null
    return await response.json() as T;
  } catch (error) {
    console.error(`API Request failed for ${url}:`, error);
    errorMessage.set(String(error))
    if (strict) {
        process.exitCode = 1
    }
    return null;
  }
}