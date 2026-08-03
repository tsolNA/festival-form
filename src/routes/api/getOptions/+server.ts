import { env } from "$env/dynamic/private";

export async function GET(): Promise<Response> {
  try {
    const response = await fetch(`${env.TESSITURA_TEST_ENDPOINT}/Custom/Execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization: `Basic ${env.TESSITURA_API_KEY}`,
        // Authorization: `Basic ${env.TESSITURA_API_KEY}`,
      },
      body: JSON.stringify({
        ProcedureName: "LP_PerformanceAndProductSearch",
        ProcedureId: 151,
        ParameterValues: [
          { Name: "perf_dt_from", Value: "2025-11-1" },
          { Name: "perf_dt_to", Value: "" },
          { Name: "onsale", Value: "1" },
          { Name: "keyword_ids", Value: "437, 436" }
        ]
      }),
    });

    if (!response.ok) {
      return new Response("Request failed", { status: response.status });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("FETCH ERROR:", err);

    return new Response("Fetch failed", { status: 500 });
  }
}