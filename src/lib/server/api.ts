import { env } from "$env/dynamic/private";
import { errorMessage } from "../stores";

export async function apiRequest<T>(
  url: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
  bodyData?: Record<string, any>,
): Promise<T | null> {
  try {
    const config: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json',
        'Authorization': env.AUTH_KEY as string
      },
    };

    // Body only exists on non-GET calls
    if (method !== 'GET' && bodyData) {
      config.body = JSON.stringify(bodyData);
      console.log("body")
    }

    const response = await fetch(env.TESSITURA_TEST_ENDPOINT + url, config);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json() as T;
    return data;
  } catch (error) {
    console.error(`API Request failed for ${url}:`, error );
    errorMessage.set(String(error))
    return null;
  }
}