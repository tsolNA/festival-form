import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { orchestrator } from '$lib/server/transaction';
import { loadPerformanceOptions } from '$lib/server/performance';

export const POST: RequestHandler = async ({ fetch }) => {
    console.log("🟢 1. API route hit successfully!");

    try {
        // Run orchestrator and trace its lifecycle
        const performanceData = await orchestrator(fetch);
        // const performanceData = await loadPerformanceOptions(fetch)
        
        console.log("🟢 2. Orchestrator completed without throwing. Data:", performanceData);
        
        return json({ success: true, data: performanceData });

    } catch (error: any) {
        // This will print the actual crash reason directly to your terminal logs
        console.error("❌ 3. CRASH DETECTED INSIDE ORCHESTRATOR:", {
            message: error?.message,
            stack: error?.stack,
            fullErrorObject: error
        });

        // Safe fallback so your client application gracefully reads the issue
        return json({ 
            success: false, 
            error: error?.message || "Internal failure inside orchestrator" 
        }, { status: 500 });
    }
};