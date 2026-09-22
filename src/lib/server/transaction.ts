import { error } from "node:console";
import { errorMessage } from "../stores";
import { apiRequest, internalResponse } from "./api";

// Address backticks and quotes for all entries
const form = {
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
let sessionKey = ''
// API structure

// Utility

function filterInactive(list: Record<string, any>) {
	list["ConstituentSummaries"]
}
async function getConstituentId(customFetch: typeof fetch): Promise<TessPerformanceResponse> {
	let constituentSummary = await apiRequest<Record<string, Array<ConstituentSummary>>>(`CRM/Constituents/Search?type=advanced&atype=Email&op=Like&value=%${form.email}&atype=Web%20Login`, customFetch)
	let constituentArray = constituentSummary !== null ?  constituentSummary["ConstituentSummaries"] : []
	if (constituentArray.length !== 1) {
		const constituentAllEmails = await apiRequest<Record<string, Array<ConstituentSummary>>>(`CRM/Constituents/Search?type=advanced&atype=Email&op=Like&value=%${form.email}`, customFetch)
		if (!constituentAllEmails) {
			return internalResponse(false, {errorMessage: "No constituent ID found"})
		}
		constituentArray = constituentAllEmails["ConstituentSummaries"].filter(constituent => constituent["Inactive"] == "Y")
		if (constituentArray.length == 0) {
			return createConstituent(customFetch)
		} else if (constituentArray.length > 1) {
			return internalResponse(false, {errorMessage: "No constituent ID found"})
		}
	}
	return checkDNS(customFetch, constituentArray[0].Id)
}

async function checkDNS(customFetch: typeof fetch, constituentId: string): Promise<TessPerformanceResponse> {
	const constituents = await apiRequest<Array<Constituent>>(`CRM/Constituencies?constituentId=${constituentId}`, customFetch, "GET")
	if (!constituents) {
		return internalResponse(false, {errorMessage: "Constituent Not Found"})
	} else {
		let dnsFilter = constituents.filter(constituent => constituent["ConstituencyType"]["ShortDescription"] == "DNS")
		if (dnsFilter.length > 0) {
			return internalResponse(false, {errorMessage: "Do not sell"})
		} else {
			return internalResponse(true, {id: constituentId})
		}
	}
}

async function createConstituent(customFetch: typeof fetch): Promise<TessPerformanceResponse> {
	// Confirmed in docs that this creates a web login
	const tCustomerId = 1 //not accurate
	let constituent = {
		ConstituentTypeId: tCustomerId,
		LastName: form.lastName,
		FirstName: form.firstName,
		OriginalSourceId: tCustomerId,
		WebLogin: {
			LoginTypeId: tCustomerId,
			Password: "Th15154NEWUZ3r&*TUBBYWUZHERe%@#$"
		}
	}
	const constituentCall = await apiRequest<Record<string, any>>(`/Web/Registration/${sessionKey}/Register`, customFetch, "POST", constituent)
	if (!constituentCall) {
		return internalResponse(false, {errorMessage: "Creation Account Failure"})
	}
	return internalResponse(true, constituentCall["LoginInfo"]["ConstituentId"])
}

async function createPermissions(customFetch: typeof fetch, constituentId: string): Promise<TessPerformanceResponse> {
	// create and update one call?
	let getAllPermissions = apiRequest("ReferenceData/ContactPermissionTypes", customFetch)
	let filteredRecords = getAllPermissions.filter(constituent => constituent["Description"] == "Email" && constituent["Category"]["Description"] == "General")
	if (filteredRecords.length == 1) {
		let constituent = {
			Constituent: {
				Id: constituentId
			},
			Type: {
				Id: constituentId
			}
		} 
		apiRequest(`CRM/ContactPermissions`, customFetch, "POST", constituent)
	} else {
		return internalResponse(false, {errorMessage: errorMessageText.moreThanOnePermission})
	}
	
	// CRMFacade.ContactPermissions.Create(newPermission)
}

async function updateContactPermissions(customFetch: typeof fetch, constituentId: string) {
	let constituentContact = apiRequest<Record<string, any>[]>(`CRM/ContactPermissions?constituentId=${constituentId}&includeAffiliations=false&activeOnly=true`, customFetch)
	if (constituentContact) {
		let filterFound = constituentContact.filter(constituent => constituent["Type"]["Description"] == "Email" && constituent["Type"]["Category"]["Description"] == "General")
		if (filterFound.length > 0) {
			if ((filterFound["Type"]["Category"]["Description"] == "Y") == form.consent) { //??????????????
				contactPermissionsUpdate() //WRITE THIS DUMMY
			}
		} else if (!form.consent){
			createPermissions(customFetch, constituentId)
		}
	}
}

async function createSeatOrder(customFetch: typeof fetch, constituentId: string) {
	// Session key created already
	apiRequest(`Web/Session/${sessionKey}/Constituents`, "PUT", {ConstituentId: constituentId})
	let cart = await apiRequest<Record<string, any>>(`Web/Cart/${sessionKey}/Properties`)
	let allConstituents = await apiRequest(`CRM/ElectronicAddresses?constituentIds=${constituentId}&includeAffiliations=false&primaryOnly=false`, customFetch)
	let filteredConstituents = filterInactive(allConstituents)
	// Sort with primary at top
	if (filteredConstituents.length == 0) {
		cart['electronicAddressId'] = "top address"
	}
	cart['deliveryMethodId'] = 6
	apiRequest(`Web/Cart/${sessionKey}/Properties`, "PUT", cart)
	const request = {
		NumberOfSeats: form.ticketAmount,
		Performanceid: globalFestival.perf_no,
		PriceType: String.Join(",", Enumerable.Repeat(price_type, attendance.NumberOfTickets)), //wut
		Zoneid: zone_no, //wut
		Unseated: false,
		SpecialRequests: "ContiguousSeats=1&" //wut
	}
	apiRequest(`Web/Cart/${sessionKey}/Tickets`, customFetch, "POST", request)
	const checkoutRequest = {
		Amount: "0.00m",
		Authorize: true, //?
		AllowUnderPayment: true
	}
	apiRequest(`Web/Cart/${sessionKey}/Checkout`, customFetch, "POST", checkoutRequest)
	const orderResult = apiRequest(`Web/Session/${sessionKey}`, customFetch)
	const printOrderRequest = {
		NewTicketNoForReprints: true,
		OrderId: orderResult['OrderId'],
		TicketDesignId: 2127,
		PrinterType: "Z",
		ReprintTickets: true
	}
	let print = apiRequest(`Web/Cart/${sessionKey}/Print/PrintStrings`, customFetch, "POST", printOrderRequest)
	// let orderresult = Web.Session.Get(session_key)
}

export async function orchestrator(customFetch: typeof fetch) {
	let sessionKeyGet = await apiRequest<Record<string, string>>(`Web/Session`, customFetch, "POST", {"string": "string"}) ?? {SessionKey: "nope"}
	sessionKey = sessionKeyGet["SessionKey"]
	// let constituentId = await getConstituentId(customFetch)
	// updateContactPermissions(customFetch, constituentId.data.id)
	// createSeatOrder(customFetch, constituentId.data.id)
	// return checkDNS(customFetch, "342957")
	// return createConstituent(customFetch)
	return sessionKey
}
