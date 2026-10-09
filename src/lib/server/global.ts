export let form = {
	firstName: 'Test',
	lastName: 'McTesty',
	email: 'tmctesty@nelson-atkins.org',
	ticketAmount: 2,
	consent: false
}

export function setForm(formData: Form) {
    form = formData
}