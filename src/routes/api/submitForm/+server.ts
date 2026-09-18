import { fail } from "@sveltejs/kit";
import type { Actions } from "../../$types";

const form = {
	firstName: '',
	lastName: '',
	email: '',
	ticketAmount: 0,
	consent: false
}
export const actions = {
	submit: async ({ request }) => {
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
		// ---- Success ----
		return {
			success: true,
			data: form
		};
	}
} satisfies Actions;