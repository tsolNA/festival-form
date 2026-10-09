import { apiRequest, internalResponse, keepALog } from "./api"
import { form } from "./global"

function priceEnumerator(performanceDetails: any) {
	let repeatedStringArray = []
	for (let i = 0; i < form.ticketAmount; i++) {
		repeatedStringArray.push(performanceDetails.priceTypeId)
	}
	return repeatedStringArray.toString()
}

async function seatTickets(customFetch: typeof fetch, constituentId: string, orderId: string) {
	let finished = false
	let count = 0
	let subline: Array<Subline> = []
	while (count < 10 && !finished) {
		let tempSubline = await apiRequest<Array<Subline>>(`TXN/SubLineItems?constituentId=${constituentId}&orderId=${orderId}`, customFetch)
		if (!tempSubline) continue
		let ticketCheck = tempSubline?.every((ticket => ticket["TicketNumber"] !== 0 || ticket["TicketNumber"] !== null)) //
		if (ticketCheck) {
			subline = tempSubline
			finished = true
		} else {
			continue
		}
	}
	if (count > 1) {
		keepALog(`Seat tickets loop ran ${count} times`)
	}
	if (subline.length == 0 || !finished) { return internalResponse(false, {textContext: `Ticket Sublines not produced ---> ${constituentId}`})}

	subline.forEach(ticket => {
		let ratRequest = {
			TicketNo: ticket["TicketNumber"],
			OverrideDoorsOpen: true,
			EventId: ticket["Performance"]["Id"]
		}
		let recordTicket = apiRequest(`AccessControl/RecordAttendance/Ticket`, customFetch, "POST", ratRequest)
		if (!recordTicket) {keepALog(`Could not mark attended for ${constituentId} --> ${ratRequest.TicketNo} -- ${ratRequest.EventId}`)}
	});
	console.log("Seats seated")
	return internalResponse(true, {data: 'success'})
}

export async function createSeatOrder(customFetch: typeof fetch, constituentId: string, sessionKey: string, performanceDetails: any) {
	let constituent = await apiRequest(`Web/Session/${sessionKey}/Constituents`, customFetch, "PUT",  {ConstituentId: constituentId})
	if (!constituent) { return internalResponse(false, {textContext: `session constituent not added ---> ${constituentId}`}) }

	let cart = await apiRequest<CartProps>(`Web/Cart/${sessionKey}/Properties`)
	if (!cart) { return internalResponse(false, {textContext: `cart has no wheels ---> ${constituentId}`}) }

	let allConstituents = await apiRequest<Array<EmailResponse>>(`CRM/ElectronicAddresses?constituentIds=${constituentId}&includeAffiliations=false&primaryOnly=false`, customFetch)
	if (!allConstituents) { return internalResponse(false, {textContext: `no constituents email found ---> ${constituentId}`})}

	let filteredConstituents = allConstituents.filter(constituent => constituent["Inactive"] == true)
	if (filteredConstituents.length > 0) {
		cart['ElectronicAddressId'] = filteredConstituents[0]["ElectronicAddressType"]["Id"]
	}
	cart['DeliveryMethodId'] = 6

	let cartUpdate = await apiRequest(`Web/Cart/${sessionKey}/Properties`, customFetch, "PUT", cart)
	if (!cartUpdate) { return internalResponse(false, {textContext: `cart update failed ---> ${constituentId}`})}

	const request = {
		NumberOfSeats: form.ticketAmount,
		PerformanceId: performanceDetails.performanceId,
		PriceType: priceEnumerator(performanceDetails),
		ZoneId: performanceDetails.zoneId,
		Unseated: false,
		SpecialRequests: "ContiguousSeats=1&"
	}
	let ticketGrab = await apiRequest(`Web/Cart/${sessionKey}/Tickets`, customFetch, "POST", request)
	if (!ticketGrab) {return internalResponse(false, {textContext: `tickets not created ---> ${constituentId}`})}

	const checkoutRequest = {
		Amount: '0.00',
		Authorize: true,
		AllowUnderPayment: true
	}
	let checkout = await apiRequest(`Web/Cart/${sessionKey}/Checkout`, customFetch, "POST", checkoutRequest)
	if (!checkout) {return internalResponse(false, {textContext: `checkout failed ---> ${constituentId}`})}

	const orderResult = await apiRequest<Order>(`Web/Session/${sessionKey}`, customFetch)
	if (!orderResult) {return internalResponse(false, {textContext: `order not found ---> ${constituentId}`})}

	const printOrderRequest = {
		NewTicketNoForReprints: true,
		OrderId: orderResult['OrderId'],
		TicketDesignId: performanceDetails.ticketDesignId,
		PrinterType: "Z",
		ReprintTickets: true
	}
	let print = await apiRequest(`Web/Cart/${sessionKey}/Print/PrintStrings`, customFetch, "POST", printOrderRequest)
	if (!print) {return internalResponse(false, {textContext: `printing failure ---> ${constituentId}`})}


	let seating = seatTickets(customFetch, constituentId, orderResult['OrderId'])
	return seating
}