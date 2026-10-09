import { apiRequest } from "./api";
import { getConstituentId } from "./constituent";
import { setForm } from "./global";
import { checkContactPermissions } from "./permissions";
import { createSeatOrder } from "./seat";

// Address backticks and quotes for all entries
// let form = {
// 	firstName: 'Test',
// 	lastName: 'McTesty',
// 	email: 'tmctesty@nelson-atkins.org',
// 	ticketAmount: 2,
// 	consent: false
// }

export async function orchestrator(customFetch: typeof fetch, performanceDetails: any, formData: Form) {
	setForm(formData)
	let sessionKeyGet = await apiRequest<Record<string, string>>(`Web/Session`, customFetch, "POST", {"string": "string"}) ?? {SessionKey: "nope"}
	let sessionKey = sessionKeyGet["SessionKey"]
	let constituentId = await getConstituentId(customFetch, sessionKey)
	if (!constituentId.ok) return constituentId

	let permission = await checkContactPermissions(customFetch, constituentId.data.id)
	if (!permission.ok) return permission

	let seat = await createSeatOrder(customFetch, constituentId.data.id, sessionKey, performanceDetails)
	// return internalResponse(false, {textContext: "testing failure"})
	return seat
}
