import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { env } from "$env/dynamic/private";
import { errorMessage } from '$lib/stores';

let form = {
	firstName: '',
	lastName: '',
	email: '',
	ticketAmount: 0,
	consent: false
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
async function searchConstituents() {
	// search specific email
	const specificEmailSearch = await apiRequest(`CRM/Constituents/Search?type=advanced&atype=Email&op=Like&value=%${form.email}`, "POST")
	let found = null
	if (!specificEmailSearch) {
		// incorrect at the moment
		const searchAllEmail = await apiRequest(`CRM/Constituents/Search?type=advanced&atype=Email&op=Like&value=%${form.email}`, "POST")
		if (searchAllEmail) {
			// remove inactive entries from responses
			found = searchAllEmail
		} else {

		}
	}
	if (!found) {
		createConstituent()
	} else {
		const constituent = apiRequest(`CRM/Constituencies?constituentId=${found.Id}&includeAffiliations=false`,"POST")
		if (constituent) {
			if (constituent == "do not sell") {
				return error
			} else {
				return constituent.id
			}
		} else {
			return error
		}
	}
	
}
async function  checkConstituent() {
	searchConstituents()
	createConstituent()
}
async function createPermissions() {
	getAllPermissionTypes()
	// CRMFacade.ContactPermissions.Create(newPermission)
}
// Big Boys

async function createConstituent() {
	// CRM.Constituents.CreateConstituentUsingSnapshot(cd) -- could be replaced potentially
	// CRM.WebLogins.Create
	let constituent = {
		ConstituentTypeId: 32,
		LastName: form.lastName,
		FirstName: form.firstName,
		OriginalSourceId: 32,
		WebLogin: {
			LoginTypeId: 32,
			Password: ''
		}
	}
	let  createCall = apiRequest(`/Web/Registration/${sessionKey}/Register`, "POST", constituent)
}
async function updateContactPermissions() {
	getAllContactPermissions()
	contactPermissionsUpdate()
	createPermissions()
}
async function createSeatOrder() {
	// Web.Session.CreateSession() returns session key
	// Web.Session.SetConstituent(session_key, setConstituentRequest)
	// cart = Web.Cart.GetCartProperties(session_key)
	// CRM.ElectronicAddresses.GetAll(constituentids: constituentid.toString(), includeAffiliations: false, primaryOnly: false)
	// Filter
	// set cart.deliveryMethodid = 6
	// Web.Cart.UpdateCartProperties(session_key, cart)
	let request = {
		// NumberOfSeats: tickets,
		// Performanceid: perf_no,
		// PriceType: String.Join(",", Enumerable.Repeat(price_type, attendance.NumberOfTickets)),
		// Zoneid: zone_no,
		// Unseated: false,
		// SpecialRequests: "ContiguousSeats=1&"
	}
	// Web.Cart.ReserveTickets(session_key, request)
	// CheckoutRequest checkoutRequest
	let checkoutRequest = {
		Amount: "0.00m",
		Authorize: true,
		AllowUnderPayment: true
	}
	// WebAssembly.Cart.Checkout(sesson_key, checkoutRequest)
	// let orderresult = Web.Session.Get(session_key)
}
async function orchestrator() {
	sessionKey = await apiRequest<string>(`/Web/Session`, "POST", undefined, true) ?? ''
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