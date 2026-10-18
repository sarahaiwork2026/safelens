import data from '../data/emergency-contacts.json';
export const CONTACTS = data.contacts;
export const CONTACTS_CHECKED = data.retrieved;
export const CONTACT_NUMBERS = new Set(CONTACTS.map((c) => c.number));
