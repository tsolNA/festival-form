import { loadPerformanceOptions } from "$lib/server/performance";

export async function load({ fetch }) {
    // Needs to be "data" to be automatically inherited
    const data = await loadPerformanceOptions(fetch);
    
    return {
        data
    };
}
