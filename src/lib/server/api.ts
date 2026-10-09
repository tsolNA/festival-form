import { env } from "$env/dynamic/private";
import { appendFile } from 'node:fs/promises';
import path from 'node:path';

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
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json() as T;
    return data;
  } catch (error) {
    console.error(`API Request failed for ${env.TESSITURA_TEST_ENDPOINT + url}:`, error );
    
    return null;
  }
}

export function internalResponse(ok: boolean, data: any) {
  if (ok) {
    return {
      ok: true,
      textContext: "",
      data: data
    }
  } else {
    keepALog(data.textContext)
    return {
      ok: false,
      textContext: data.textContext
    }
  }
}

export async function keepALog(message: string) {
  const filePath = path.resolve('static', 'output.txt');
  const today = new Date()
  try {
    await appendFile(filePath, today + " ----- " + message + '\n', 'utf8');
    return true;
  } catch (err) {
    const fsError = err as NodeJS.ErrnoException;
    
    console.error(`Failed to write to ${filePath}. Code: ${fsError.code}`);
    
    throw new Error(`File append failed: ${fsError.message}`);
  }
}