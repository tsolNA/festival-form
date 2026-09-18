import { json } from "@sveltejs/kit";
import { apiRequest } from "./api";

function isDateToday(date: string) {
  let today = new Date().setHours(0, 0, 0, 0)
  let dateConverted = new Date(date).setHours(0, 0, 0, 0)
  return today == dateConverted
}

function returnFunction() {
// write the structure for the return here
}

async function filterMuseumAdmission(customFetch: typeof fetch): Promise<TessPerformanceResponse> {
  let rawEvents = await apiRequest<Array<TessSeason>>(`ReferenceData/Seasons`, customFetch)
  if (!rawEvents) {
    return {
      errorMessage: "Nothing in ReferenceData/Seasons",
      name: '',
      id: '',
      ok: false
    }
  }
  let today = new Date()
  // If testing without filter, set activeOnly to true in query param
  let filteredForTime = rawEvents.filter(singleEvent => new Date(singleEvent["StartDateTime"]) <= today && new Date(singleEvent["EndDateTime"]) >= today)

  if (filteredForTime.length == 1) {
    let productionSeasons = await apiRequest<Array<ProductionSeason>>(`TXN/ProductionSeasons?seasonIds=${filteredForTime[0]["Id"]}`, customFetch)
    if (!productionSeasons) {
      return {
        errorMessage: "Nothing in TXN/ProductionSeasons",
        name: '',
        id: '',
        ok: false
      }
    }
    let filteredMuseumAdmission = productionSeasons.filter(productionSeason => productionSeason["Production"]["Description"] == "Museum Admission") //*Night Shift & Deaf cultural need their own check
    return {
      errorMessage: "",
      name: '',
      id: filteredMuseumAdmission[0]["Id"],
      ok: true,
    } 
  } else {
    return {
      errorMessage: "too many fiscal years",
      name: '',
      id: '',
      ok: false
    }
  }
}

async function findAvailable(customFetch: typeof fetch, id: string): Promise<TessPerformanceResponse> {
  let performances = await apiRequest<Array<TessPerformance>>(`TXN/Performances?productionSeasonId=${id}`, customFetch)
  if (!performances) {
    return {
      errorMessage: "Nothing in TXN/Performances",
      name: '',
      id: '',
      ok: false
    }
  }
  let filteredForAvailable = performances.filter(performance => performance["AvailSaleIndicator"] == true && isDateToday(performance["Date"]))
  if (filteredForAvailable.length == 1) {
    return {
      errorMessage: "",
      name: '',
      id: filteredForAvailable[0]["Id"],
      ok: true
    } 
  } else {
    return {
      errorMessage: "too many avaiable to sell",
      name: '',
      id: '',
      ok: false,
    }
  }
}

async function findBaseIndicator(customFetch: typeof fetch, performanceId: string): Promise<TessPerformanceResponse> {
  let priceType = await apiRequest<Array<TessPriceType>>(`TXN/PerformancePriceTypes?performanceIds=${performanceId}`, customFetch) //
  if (!priceType) {
    return {
      errorMessage: "Nothing in TXN/PerformancePriceTypes",
      name: '',
      id: '',
      ok: false,
    }
  }
  
  let filteredForBaseIndicator = priceType.filter(type => type["BaseIndicator"] == true)
  return {
    errorMessage: "Nothing in TXN/PerformancePriceTypes",
    name: '',
    id: '',
    ok: false,
    data: filteredForBaseIndicator[0]
  }
  if (filteredForBaseIndicator.length == 1) {
    let filteredForPriceTypes = filteredForBaseIndicator[0]["PerformancePrices"].filter(performancePrices => performancePrices["PerformancePrices"]["Enabled"] == true)
    if (filteredForPriceTypes.length == 1) {
      return {
        errorMessage: "",
        name: '',
        id: filteredForPriceTypes[0]["PerformancePrices"]["PerformanceId"],// Set PriceTypeId, PerformancePrices.zoneid, and TicketDesignId to cart
        ok: true
      } 
    } else {
      return {
      errorMessage: "More than one zone in price type",
      name: '',
      id: '',
      ok: false,
    }
    }
  } else {
    return {
      errorMessage: "too many price types",
      name: '',
      id: '',
      ok: false,
    }
  }
}

// Gets the performance of the day for the thing to work in general
export async function loadPerformanceOptions(customFetch: typeof fetch): Promise<TessPerformanceResponse> {
  let filteredMuseumAdmission = await filterMuseumAdmission(customFetch)
  if (!filteredMuseumAdmission.ok) {
    return filteredMuseumAdmission
  }
  let filteredForAvailable = await findAvailable(customFetch, filteredMuseumAdmission.id)

  let filteredForBaseIndicator = await findBaseIndicator(customFetch, filteredForAvailable.id)

  return filteredForBaseIndicator

  
}