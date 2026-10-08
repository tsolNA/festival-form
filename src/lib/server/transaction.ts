import { apiRequest, internalResponse, keepALog } from "./api";

// Address backticks and quotes for all entries
let form = {
	firstName: 'Test',
	lastName: 'McTesty',
	email: 'tmctesty@nelson-atkins.org',
	ticketAmount: 2,
	consent: false
}
const errorMessageText = {
	doNotSell: '',
	multipleEmailAccount: '',
	creationAccountIdMissing: '',
	moreThanOnePermission: ''
}
let globals = {
	performanceId: 50833,
	zoneId: 65,
	priceTypeId: 13,
	ticketDesignId: "2128"
}
// API structure

function priceEnumerator() {
	let repeatedStringArray = []
	for (let i = 0; i < form.ticketAmount; i++) {
		repeatedStringArray.push(globals.priceTypeId)
	}
	return repeatedStringArray.toString()
}
async function getConstituentId(customFetch: typeof fetch, sessionKey: string): Promise<TessPerformanceResponse> {
	let constituentSummary = await apiRequest<Record<string, Array<ConstituentSummary>>>(`CRM/Constituents/Search?type=advanced&atype=Email&op=Like&value=%${form.email}&atype=Web%20Login`, customFetch)
	let constituentArray = constituentSummary !== null ?  constituentSummary["ConstituentSummaries"] : []

	if (constituentArray.length !== 1) {
		const constituentAllEmails = await apiRequest<Record<string, Array<ConstituentSummary>>>(`CRM/Constituents/Search?type=advanced&atype=Email&op=Like&value=%${form.email}`, customFetch)
		if (!constituentAllEmails) {
			return internalResponse(false, {textContext: "No constituent ID found"})
		}
		constituentArray = constituentAllEmails["ConstituentSummaries"].filter(constituent => constituent["Inactive"] == true)
		if (constituentArray.length == 0) {
			return createConstituent(customFetch, sessionKey)
		} else if (constituentArray.length > 1) {
			console.log("here")
			console.log(constituentArray)
			return internalResponse(false, {textContext: "No constituent ID found"})
		}

	}

	return checkDNS(customFetch, constituentArray[0].Id)
}
// Confirm that DNS results in failure
async function checkDNS(customFetch: typeof fetch, constituentId: string): Promise<TessPerformanceResponse> {
	const constituents = await apiRequest<Array<Constituent>>(`CRM/Constituencies?constituentId=${constituentId}`, customFetch, "GET") //342957 DNS
	if (!constituents) {
		return internalResponse(false, {textContext: "Constituent Not Found"})
	} else {
		let dnsFilter = constituents.filter(constituent => constituent["ConstituencyType"]["ShortDescription"] == "DNS")
		if (dnsFilter.length > 0) {
			return internalResponse(false, {textContext: "DNS issue"})
		} else {
			console.log("ID checked for DNS")
			return internalResponse(true, {id: constituentId})
		}
	}
}

async function createConstituent(customFetch: typeof fetch, sessionKey: string): Promise<TessPerformanceResponse> {
	let constituent = {
		ConstituentTypeId: 1,
		LastName: form.lastName,
		FirstName: form.firstName,
		OriginalSourceId: 5,
		PrimaryElectronicAddress: {
			Address: form.email
		},
		WebLogin: {
			LoginTypeId: 1,
			Password: "Th15154NEWUZ3r&*TUBBYWUZHERe@#%@$#%^FASF"
		}
	}
	const constituentCall = await apiRequest<Record<string, any>>(`Web/Registration/${sessionKey}/Register`, customFetch, "POST", constituent)
	
	if (!constituentCall) {
		return internalResponse(false, {textContext: "Account Creation Failure"})
	}
	console.log("constituent created")
	return internalResponse(true, {id: constituentCall["LoginInfo"]["ConstituentId"]})
}

async function checkContactPermissions(customFetch: typeof fetch, constituentId: string) {
	let constituentContact = await apiRequest<Array<ContactPermissions>>(`CRM/ContactPermissions?constituentId=${constituentId}&includeAffiliations=false&activeOnly=true`, customFetch)
	if (constituentContact) {
		let filterFound = constituentContact.filter(constituent => constituent["Type"]["Description"] == "Email" && constituent["Type"]["Category"]["Description"] == "General")
		if (filterFound.length > 0) {
			if ((filterFound[0]["Answer"] == "Y" || filterFound[0]["Answer"] == null) !== form.consent) {
				// No and No = do nothing
				// Yes and Yes = do nothing
				// No and Yes = update
				// Yes and No = update
				let update = contactPermissionsUpdate(customFetch, constituentId, filterFound[0]["Id"], filterFound[0]["UpdatedDateTime"])
				return update
			}
		} else if (!form.consent){
			let creation = await createPermissions(customFetch, constituentId)
			return creation
		}
		// Logic Check -- if no action needed, don't fail
		console.log("Permissions don't need adjusting")
		return internalResponse(true, {textContext: "no action needed"})
	}
	keepALog(`Failed to find constituent permissions contactId: ${constituentId} -- ${form.email}`)
	return internalResponse(true, {textContext: "Failed to find constituent contact"})
}

async function createPermissions(customFetch: typeof fetch, constituentId: string): Promise<TessPerformanceResponse> {
	// create and update one call? CreateORUpdate
	
	let getAllPermissions = await apiRequest<Array<ContactPermissionTypes>>("ReferenceData/ContactPermissionTypes", customFetch)
	if (!getAllPermissions) {
		return internalResponse(false, {textContext: "Contact Permission Type Not Found"})
	}
	let filteredRecords = getAllPermissions.filter(permissionType => permissionType["Description"] == "Email" && permissionType["Category"]["Description"] == "General")
	if (filteredRecords.length == 1) {
		let requestObject = {
			Answer: form.consent ? "Y" : "N",
			Constituent: {
				Id: constituentId
			},
			Type: {
				Id: 1,
				Description: "Email",
				Category: {
					Id: 1,
					Description: "General"
				},
			}
		} 
		let permissions = await apiRequest(`CRM/ContactPermissions`, customFetch, "POST", requestObject)
		if (!permissions) {
			return internalResponse(false, {textContext: "Permissions not created"})
		}
		console.log("Permissions created")
		return internalResponse(true, {data: permissions})
	} else {
		// keepalog() keep constituent ID and consent choice
		return internalResponse(false, {textContext: errorMessageText.moreThanOnePermission})
	}
}

async function contactPermissionsUpdate(customFetch: typeof fetch, constituentId: string, filteredId: string, date: string) {
	let constituentInfo = {
		Answer: form.consent ? "Y" : "N",
		Id: filteredId,
		UpdatedDateTime: date,
		Constituent: {
			Id: constituentId
		},
		Type: {
			Id: 1,
			Description: "Email",
			Category: {
				Id: 1,
				Description: "General"
			},
		}
	}
	let updateRequest = await apiRequest(`CRM/ContactPermissions/${filteredId}`, customFetch, "PUT", constituentInfo)//<--------------
	if (updateRequest) {
		console.log("Permissions updated")
		return internalResponse(true, {data:updateRequest})
	} else {
		// keepalog() keep constituent ID and consent choice
		return internalResponse(false, {textContext: "Could not update permissions"})
	}
}

async function createSeatOrder(customFetch: typeof fetch, constituentId: string, sessionKey: string) {
	let constituent = await apiRequest(`Web/Session/${sessionKey}/Constituents`, customFetch, "PUT",  {ConstituentId: constituentId})
	if (!constituent) { return internalResponse(false, {textContext: "session constituent not added"}) }

	let cart = await apiRequest<CartProps>(`Web/Cart/${sessionKey}/Properties`)
	if (!cart) { return internalResponse(false, {textContext: "cart has no wheels"}) }

	let allConstituents = await apiRequest<Array<EmailResponse>>(`CRM/ElectronicAddresses?constituentIds=${constituentId}&includeAffiliations=false&primaryOnly=false`, customFetch)
	if (!allConstituents) { return internalResponse(false, {textContext: `no constituents email found ${constituentId}`})}

	let filteredConstituents = allConstituents.filter(constituent => constituent["Inactive"] == true)
	if (filteredConstituents.length > 0) {
		cart['ElectronicAddressId'] = filteredConstituents[0]["ElectronicAddressType"]["Id"]
	}
	cart['DeliveryMethodId'] = 6

	let cartUpdate = await apiRequest(`Web/Cart/${sessionKey}/Properties`, customFetch, "PUT", cart)
	if (!cartUpdate) { return internalResponse(false, {textContext: "cart update failed"})}

	const request = {
		NumberOfSeats: form.ticketAmount,
		PerformanceId: globals.performanceId,
		PriceType: priceEnumerator(),
		ZoneId: globals.zoneId,
		Unseated: false,
		SpecialRequests: "ContiguousSeats=1&"
	}
	let ticketGrab = await apiRequest(`Web/Cart/${sessionKey}/Tickets`, customFetch, "POST", request)
	if (!ticketGrab) {return internalResponse(false, {textContext: "tickets not created"})}

	const checkoutRequest = {
		Amount: '0.00',
		Authorize: true,
		AllowUnderPayment: true
	}
	let checkout = await apiRequest(`Web/Cart/${sessionKey}/Checkout`, customFetch, "POST", checkoutRequest)
	if (!checkout) {return internalResponse(false, {textContext: "checkout failed"})}

	const orderResult = await apiRequest<Order>(`Web/Session/${sessionKey}`, customFetch)
	if (!orderResult) {return internalResponse(false, {textContext: "order not found"})}

	const printOrderRequest = {
		NewTicketNoForReprints: true,
		OrderId: orderResult['OrderId'],
		TicketDesignId: globals.ticketDesignId,
		PrinterType: "Z",
		ReprintTickets: true
	}
	let print = await apiRequest(`Web/Cart/${sessionKey}/Print/PrintStrings`, customFetch, "POST", printOrderRequest)
	if (!print) {return internalResponse(false, {textContext: "printing failure"})}


	let seating = seatTickets(customFetch, constituentId, orderResult['OrderId'])
	return seating
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
	if (subline.length == 0 || !finished) { return internalResponse(false, {textContext: "Ticket Sublines not produced"})}

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


export async function orchestrator(customFetch: typeof fetch, formGlobals: any, formData: any) {
	globals = formGlobals
	form = formData
	let sessionKeyGet = await apiRequest<Record<string, string>>(`Web/Session`, customFetch, "POST", {"string": "string"}) ?? {SessionKey: "nope"}
	let sessionKey = sessionKeyGet["SessionKey"]
	let constituentId = await getConstituentId(customFetch, sessionKey)
	if (!constituentId.ok) return constituentId

	let permission = await checkContactPermissions(customFetch, constituentId.data.id)
	if (!permission.ok) return permission

	let seat = await createSeatOrder(customFetch, constituentId.data.id, sessionKey)
	// return internalResponse(false, {textContext: "testing failure"})
	return seat
	// checkContactPermissions(customFetch, constituentId.data.id)
	// createSeatOrder(customFetch, constituentId.data.id)
	// return checkDNS(customFetch, "342957")
	// return createConstituent(customFetch)
}
