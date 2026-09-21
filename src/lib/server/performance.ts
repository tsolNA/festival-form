import { apiRequest, internalResponse } from "./api";

function isDateToday(date: string) {
  let today = new Date().setHours(0, 0, 0, 0)
  let dateConverted = new Date(date).setHours(0, 0, 0, 0)
  return today == dateConverted
}

async function filterMuseumAdmission(customFetch: typeof fetch): Promise<TessPerformanceResponse> {
  let rawEvents = await apiRequest<Array<TessSeason>>(`ReferenceData/Seasons`, customFetch)
  if (!rawEvents) {
    return {
      errorMessage: "Nothing in ReferenceData/Seasons",
      ok: false
    }
  }
  let today = new Date()
  // If testing without filter, set activeOnly to true in query param
  let filteredForTime = rawEvents.filter(singleEvent => new Date(singleEvent["StartDateTime"]) <= today && new Date(singleEvent["EndDateTime"]) >= today)

  if (filteredForTime.length == 1) {
    let productionSeasons = await apiRequest<Array<ProductionSeason>>(`TXN/ProductionSeasons?seasonIds=${filteredForTime[0]["Id"]}`, customFetch)
    if (!productionSeasons) {
      return internalResponse(false, {errorMessage: "Nothing in TXN/ProductionSeasons"})
    }
    let filteredMuseumAdmission = productionSeasons.filter(productionSeason => productionSeason["Production"]["Description"] == "Museum Admission") //*Night Shift & Deaf cultural need their own check
    
    return internalResponse(true, {id: filteredMuseumAdmission[0]["Id"]})
  } else {
    return internalResponse(false, {errorMessage: "too many fiscal years"})
  }
}

async function findAvailable(customFetch: typeof fetch, id: string): Promise<TessPerformanceResponse> {
  let performances = await apiRequest<Array<TessPerformance>>(`TXN/Performances?productionSeasonId=${id}`, customFetch)
  if (!performances) {
    return internalResponse(false, {errorMessage: "Nothing in TXN/Performances"})
  }
  let filteredForAvailable = performances.filter(performance => performance["AvailSaleIndicator"] == true && isDateToday(performance["Date"]))
  if (filteredForAvailable.length == 1) {
    return internalResponse(true, {id: filteredForAvailable[0]["Id"]})
  } else {
    return internalResponse(false, {errorMessage: "too many avaiable to sell"})
  }
}

async function findBaseIndicator(customFetch: typeof fetch, performanceId: string): Promise<TessPerformanceResponse> {
  let priceType = await apiRequest<Array<TessPriceType>>(`TXN/PerformancePriceTypes?performanceIds=${performanceId}`, customFetch) //
  if (!priceType) {
    return internalResponse(false, {errorMessage: "Nothing in TXN/PerformancePriceTypes"})
  }
  
  let filteredForBaseIndicator = priceType.filter(type => type["BaseIndicator"] == true)
  if (filteredForBaseIndicator.length == 1) {
    let filteredForPriceTypes = filteredForBaseIndicator[0]["PerformancePrices"].filter(performancePrices => performancePrices["Enabled"] == true)
    if (filteredForPriceTypes.length == 1) {
      return internalResponse(true, {
          PriceTypeId: filteredForPriceTypes[0]["Id"],// Set PriceTypeId, PerformancePrices.zoneid, and TicketDesignId to cart
          ZoneId: filteredForPriceTypes[0]["ZoneId"],
          TicketDesignId: filteredForBaseIndicator[0]["TicketDesignId"]
      })
    } else {
      return internalResponse(false, {errorMessage: "More than one zone in price type"})
    }
  } else {
    return internalResponse(false, {errorMessage: "too many price types"})
  }
}

// Gets the performance of the day for the thing to work in general
export async function loadPerformanceOptions(customFetch: typeof fetch): Promise<TessPerformanceResponse> {
  let filteredMuseumAdmission = await filterMuseumAdmission(customFetch)
  if (!filteredMuseumAdmission.ok || !filteredMuseumAdmission.data.id) {
    return filteredMuseumAdmission
  }

  let filteredForAvailable = await findAvailable(customFetch, filteredMuseumAdmission.data.id)
  if (!filteredForAvailable.ok || !filteredForAvailable.data.id) {
    return filteredForAvailable
  }

  let filteredForBaseIndicator = await findBaseIndicator(customFetch, filteredForAvailable.data.id)
  
  return filteredForBaseIndicator

  
}