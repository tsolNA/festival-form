import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { env } from "$env/dynamic/private";
import { errorMessage } from '$lib/stores';

const form = {
	firstName: '',
	lastName: '',
	email: '',
	ticketAmount: 0,
	consent: false
}
const errorMessages = {
	doNotSell: '',
	multipleEmailAccount: '',
	creationAccountIdMissing: '',
	moreThanOnePermission: ''
}
let sessionKey = ''
// API structure
async function apiRequest<T>(
  url: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
  bodyData?: Record<string, any>,
  strict?: boolean
): Promise<T | null> {
  try {
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Body only exists on non-GET calls
    if (method !== 'GET' && bodyData) {
      config.body = JSON.stringify(bodyData);
    }

    const response = await fetch(env.TESSITURA_TEST_ENDPOINT + url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`API Request failed for ${url}:`, error);
	errorMessage.set(String(error))
	if (strict) {
		process.exitCode = 1
	}
    return null;
  }
}
// Utility
function keepALog(message: string) {

}
function filterInactive(list: Record<string, any>) {
	list["ConstituentSummaries"]
}
async function getConstituentId(): Promise<string> {
	// search specific email
	let constituentSummary = await apiRequest(`CRM/Constituents/Search?type=advanced&atype=Email&op=Like&value=%${form.email}&atype=Web%20Login`)
	if (!constituentSummary) {
		const constituentAllEmails = await apiRequest(`CRM/Constituents/Search?type=advanced&atype=Email&op=Like&value=%${form.email}`)
		constituentSummary = constituentAllEmails.filter(constituent => constituent["Inactive"] == false)
		if (constituentSummary.size == 0) {
			return createConstituent()
		} else if (constituentSummary.size > 1) {
			return error
		}
	}
	const constituent = await apiRequest(`CRM/Constituencies?constituentId=${constituentSummary.Id}&includeAffiliations=false`,"POST", undefined, true)
	if (constituent == "do not sell") {
		return errorMessage.set(errorMessages.doNotSell)
	} else {
		return constituent.id
	}
}
async function createPermissions(constituentId: string) {
	// create and update one call?
	let getAllPermissions = apiRequest("ReferenceData/ContactPermissionTypes")
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
		apiRequest(`CRM/ContactPermissions`, "POST", constituent)
	} else {
		return keepALog(errorMessages.moreThanOnePermission)
	}
	
	// CRMFacade.ContactPermissions.Create(newPermission)
}
// Big Boys

async function createConstituent() {
	// Confirmed in docs that this creates a web login
	let constituent = {
		ConstituentTypeId: 32,
		LastName: form.lastName,
		FirstName: form.firstName,
		OriginalSourceId: 32,
		WebLogin: {
			LoginTypeId: 32,
			Password: "Th15154NEWUZ3r&*TUBBYWUZHERe%@#$"
		}
	}
	const constituentCall = apiRequest<Record<string, any>>(`/Web/Registration/${sessionKey}/Register`, "POST", constituent, true)
	if (!constituentCall) {
		errorMessage.set(errorMessages.creationIdMissing)
		return null
	}
	return constituentCall["LoginInfo"]["ConstituentId"]
}

async function updateContactPermissions(constituentId: string) {
	let constituentContact = apiRequest<Record<string, any>[]>(`CRM/ContactPermissions?constituentId=${constituentId}&includeAffiliations=false&activeOnly=true`, "GET", )
	if (constituentContact) {
		let filterFound = constituentContact.filter(constituent => constituent["Type"]["Description"] == "Email" && constituent["Type"]["Category"]["Description"] == "General")
		if (filterFound.length > 0) {
			if (!filterFound["Type"]["Category"]["Description"] == form.consent) { //?????
				contactPermissionsUpdate()
			}
		} else if (!form.consent){
			createPermissions(constituentId)
		}
	}
}

async function createSeatOrder(constituentId: string) {
	// Session key created already
	apiRequest(`Web/Session/${sessionKey}/Constituents`, "PUT", {ConstituentId: constituentId})
	let cart = await apiRequest<Record<string, any>>(`Web/Cart/${sessionKey}/Properties`)
	let allConstituents = await apiRequest(`CRM/ElectronicAddresses?constituentIds=${constituentId}&includeAffiliations=false&primaryOnly=false`)
	let filteredConstituents = filterInactive(allConstituents)
	// Sort with primary at top
	if (filteredConstituents.length == 0) {
		cart['electronicAddressId'] = "top address"
	}
	cart['deliveryMethodId'] = 6
	apiRequest(`Web/Cart/${sessionKey}/Properties`, "PUT", cart)
	let request = {
		NumberOfSeats: form.ticketAmount,
		Performanceid: globalFestival.perf_no,
		PriceType: String.Join(",", Enumerable.Repeat(price_type, attendance.NumberOfTickets)), //wut
		Zoneid: zone_no, //wut
		Unseated: false,
		SpecialRequests: "ContiguousSeats=1&" //wut
	}
	apiRequest(`Web/Cart/${sessionKey}/Tickets`, "POST", request)
	let checkoutRequest = {
		Amount: "0.00m",
		Authorize: true,
	}
	let orderResult = apiRequest(`Web/Cart/${sessionKey}/Checkout`, "POST", checkoutRequest)
	// let orderresult = Web.Session.Get(session_key)
}
async function orchestrator() {
	sessionKey = await apiRequest<string>(`/Web/Session`, "POST", undefined, true) ?? ''
	let constituentId: string | null = await getConstituentId()
	updateContactPermissions(constituentId)
	createSeatOrder(constituentId)
}
export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		form.firstName = data.get('firstName')?.toString() ?? ''
		form.lastName = data.get('lastName')?.toString() ?? ''
		form.email = data.get('email')?.toString() ?? ''
		form.ticketAmount = Math.trunc(Number(data.get('ticketAmount'))) ?? 1
		form.consent = data.has('consent');


		const errors: Record<string, string> = {};

		// ---- Helpers ----
		const isSafeString = (str: string): boolean => {
			return /^[a-zA-Z\s'-]+$/.test(str);
		};

		const isEmailValid = (email: string): boolean => {
			return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
		};

		// ---- Validation ----

		if (!form.firstName || form.firstName.trim().length < 2 || !isSafeString(form.firstName)) {
			errors.firstName =
				'First name must be at least 2 characters and contain only valid characters.';
		}

		if (!form.lastName || form.lastName.trim().length < 2 || !isSafeString(form.lastName)) {
			errors.lastName =
				'Last name must be at least 2 characters and contain only valid characters.';
		}

		if (!form.email || !isEmailValid(form.email)) {
			errors.email = 'Invalid email format.';
		}

		if (
			!form.ticketAmount ||
			form.ticketAmount < 1 ||
			form.ticketAmount > 10
		) {
			errors.ticketAmount =
				'Ticket amount must be an integer between 1 and 10.';
		}

		// ---- Return Errors ----
		if (Object.keys(errors).length > 0) {
			console.log(Object.keys(errors))
			return fail(400, {
				success: false,
				errors
			});
		}
		orchestrator()
		// ---- Success ----
		return {
			success: true,
			data: form
		};
	}
} satisfies Actions;