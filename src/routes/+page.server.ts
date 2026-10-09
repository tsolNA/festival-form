import { orchestrator } from "$lib/server/orchestrator";
import { loadPerformanceOptions } from "$lib/server/performance";
import type { Actions } from './$types';
import { fail } from "@sveltejs/kit";

export async function load({ fetch }) {
    // Needs to be "data" to be automatically inherited
    const data = await loadPerformanceOptions(fetch);
    
    return {
        data
    };
}
const form = {
	firstName: '',
	lastName: '',
	email: '',
	ticketAmount: 1,
	consent: false
}
export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		form.firstName = data.get('firstName')?.toString() ?? ''
		form.lastName = data.get('lastName')?.toString() ?? ''
		form.email = data.get('email')?.toString() ?? ''
		form.ticketAmount = Math.trunc(Number(data.get('ticketAmount'))) ?? 1
		form.consent = data.get('consent') == 'on';


		const errors: Record<string, string> = {};
		// ---- Helpers ----
		const isSafeString = (str: string): boolean => {
			return /^[a-zA-Z\s'`-]+$/.test(str);
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
		console.log(form)
		const admissionData = await orchestrator(fetch, {
			performanceId: data.get('performanceId')?.toString(),
			zoneId: data.get('zoneId')?.toString(),
			priceTypeId: data.get('priceTypeId')?.toString(),
			ticketDesignId: data.get('ticketDesignId')?.toString()
		}, 
        form);
		// ---- Return Errors ----
		if (Object.keys(errors).length > 0) {
			Object.keys(errors).forEach(element => {
                console.log(`${element}: ${errors.element}`)
            });
			return fail(400, {
				success: false,
				errors
			});
		}
        console.log(admissionData)
		// ---- Success ----
		return admissionData
	}
} satisfies Actions;
