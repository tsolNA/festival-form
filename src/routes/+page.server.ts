import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const firstName = data.get('firstName') as string | null;
		const lastName = data.get('lastName') as string | null;
		const email = data.get('email') as string | null;
		const ticketAmountRaw = data.get('ticketAmount') as string | null;
		const consent = data.has('consent');

		const errors: Record<string, string> = {};

		// ---- Helpers ----
		const isSafeString = (str: string): boolean => {
			return /^[a-zA-Z\s'-]+$/.test(str);
		};

		const isEmailValid = (email: string): boolean => {
			return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
		};

		// ---- Validation ----

		if (!firstName || firstName.trim().length < 2 || !isSafeString(firstName)) {
			errors.firstName =
				'First name must be at least 2 characters and contain only valid characters.';
		}

		if (!lastName || lastName.trim().length < 2 || !isSafeString(lastName)) {
			errors.lastName =
				'Last name must be at least 2 characters and contain only valid characters.';
		}

		if (!email || !isEmailValid(email)) {
			errors.email = 'Invalid email format.';
		}

		const ticketAmount = Number(ticketAmountRaw);

		if (
			!ticketAmountRaw ||
			!Number.isInteger(ticketAmount) ||
			ticketAmount < 1 ||
			ticketAmount > 10
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
			data: {
				firstName,
				lastName,
				email,
				ticketAmount,
				consent
			}
		};
	}
} satisfies Actions;