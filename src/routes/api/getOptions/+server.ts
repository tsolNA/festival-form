import { apiRequest } from "$lib/server/api";
import { errorMessage, performanceId } from "$lib/stores";
import { get } from "svelte/store";

function isDateToday(date: string) {
  let today = new Date().setHours(0, 0, 0, 0)
  let dateConverted = new Date(date).setHours(0, 0, 0, 0)
  return today == dateConverted
}
// Gets the performance of the day for the thing to work in general
export async function GET(): Promise<Record<string, any> | void> {
  let rawEvents = await apiRequest<Array<TessSeason>>(`ReferenceData/Seasons`, "GET", undefined, true)
  let today = new Date()
  // If testing without filter, set activeOnly to true in query param
  let filteredForTime = rawEvents.filter(singleEvent => new Date(singleEvent["StartDateTime"]) >= today && new Date(singleEvent["EndDateTime"]) <= today)
  let filteredMuseumAdmission = null
  let filteredForAvailable = null;
  let filteredForBaseIndicator = null;
  let result = null

  if (filteredForTime.length == 1) {
    let productionSeasons = await apiRequest<Array<ProductionSeason>>(`TXN/ProductionSeasons?seasonIds=${filteredForTime[0]["Id"]}`, "GET", undefined, true)
    filteredMuseumAdmission = productionSeasons.filter(productionSeason => productionSeason["Production"]["Description"] == "Museum Admission") //*Night Shift & Deaf cultural need their own check
  } else {
    errorMessage.set("too many fiscal years")
    return
  }

  if (filteredMuseumAdmission.length == 1) {
    let performances = await apiRequest<Array<TessPerformance>>(`TXN/Performances?productionSeasonId=${filteredMuseumAdmission[0]["Id"]}`, "GET", undefined, true)
    filteredForAvailable = performances.filter(performance => performance["AvailSaleIndicator"] == true && isDateToday(performance["Date"]))
    if (filteredForAvailable.length == 1) {
      performanceId.set(filteredForAvailable[0]["Id"])
    } else {
      errorMessage.set("too many avaiable to sell")
      return
    }
  }

  if (get(performanceId) !== "") {
    let priceType = await apiRequest<Array<TessPriceType>>(`TXN/PerformancePriceTypes?performanceIds=${performanceId}`, "GET", undefined, true) //
    filteredForBaseIndicator = priceType.filter(type => type["BaseIndicator"] == true)
  }

  if (filteredForBaseIndicator && filteredForBaseIndicator.length == 1) {
    let filteredForPriceTypes = filteredForBaseIndicator[0]["PerformancePrices"].filter(performancePrices => performancePrices["PerformancePrices"]["Enabled"] == true)
    if (filteredForPriceTypes.length == 1) {
      result = filteredForPriceTypes[0] // Set PriceTypeId, PerformancePrices.zoneid, and TicketDesignId to cart
    } else {
      errorMessage.set("More than one zone in price type")
    }
  } else {
    errorMessage.set("too many price types")
    return
  }
  return result
}