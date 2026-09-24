import { env } from "$env/dynamic/private";
import { errorMessage } from "$lib/stores";

export async function apiRequest<T>(
  url: string, 
  customFetch?: typeof fetch,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
  bodyData?: Record<string, any>
): Promise<T | null> {
  try {
    const config: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': env.AUTH_KEY as string
      },
    };
    if (method !== 'GET' && bodyData) {
      config.body = JSON.stringify(bodyData);
    }

    // Use customFetch if provided, otherwise default to global fetch
    const fetcher = customFetch || fetch;

    const response = await fetcher(env.TESSITURA_TEST_ENDPOINT + url, config);
    console.log(response)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json() as T;
    return data;
  } catch (error) {
    console.error(`API Request failed for ${env.TESSITURA_TEST_ENDPOINT + url}:`, error );
    errorMessage.set(String(error));
    
    return null;
  }
}

export function internalResponse(ok: boolean, data: object) {
  if (ok) {
    return {
      ok: true,
      errorMessage: "",
      data: data
    }
  } else {
    return {
      errorMessage: data.errorMessage,
      ok: false
    }
  }
}

export function keepALog(message: string) {

}