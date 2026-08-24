import { apiRequest } from "$lib/server/api";
import { errorMessage } from "$lib/stores";

export async function GET(): Promise<Record<string, any> | void> {
  let rawEvents = await apiRequest<Record<string,any>[]>(`ReferenceData/Seasons?filter={filter}&maintenanceMode={maintenanceMode}&activeOnly={activeOnly}`)
  if (rawEvents) {
    let today = new Date()
    let filtered = rawEvents.filter(singleEvent => new Date(singleEvent["StartDateTime"]) >= today && new Date(singleEvent["EndDateTime"]) <= today)
    
    if (filtered.length == 1) {
      apiRequest(`TXN/ProductionSeasons?seasonIds={seasonIds}&productionIds={productionIds}&titleIds={titleIds}&ids={ids}`) //need seasonId
    } else {
      errorMessage.set("too many fiscal years")
    }
  }
  return result
}