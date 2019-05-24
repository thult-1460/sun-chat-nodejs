import Http from './../utils/Http';

export function getContactRequest(page) {
  return new Http().authenticated().get(`/my-contact-request?page=${page}`);
}

export function getNumberContactRequest() {
  return new Http().authenticated().get('/my-contact-request-number');
}

export function rejectContact(contactIds) {
  return new Http().authenticated().post('/reject-contact', contactIds);
}

export function getListContacts(page) {
  return new Http().authenticated().get(`/contacts?page=${page}`);
}

export function getContactCount() {
  return new Http().authenticated().get('/contacts-number');
}

export function acceptContact(contactIds) {
  return new Http().authenticated().post('/accept-contact', contactIds);
}

export function deleteContact(contactId) {
  return new Http().authenticated().delete('/delete-contact', contactId);
}
