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

export function getListContacts(page, searchText = '') {
  return new Http().authenticated().get(`/contacts?searchText=${searchText}&page=${page}`);
}

export function getLimitListContacts(limit, searchText = '') {
  return new Http().authenticated().get(`/contacts?searchText=${searchText}&limit=${limit}`);
}

export function acceptContact(contactIds) {
  return new Http().authenticated().post('/accept-contact', contactIds);
}

export function deleteContact(contactId) {
  return new Http().authenticated().delete('/delete-contact', contactId);
}

export function getSearchContactByName(searchText, page) {
  return new Http().authenticated().get(`/user-search?searchText=${searchText}&page=${page}`);
}

export function addContact(userId) {
  return new Http().authenticated().post('/send-request-contact', userId);
}

export function getListSentRequestContacts() {
  return new Http().authenticated().get(`/list-sent-request-contacts`);
}

export function deleteSentRequestContact(contactId) {
  return new Http().authenticated().delete('/request-sent-contact', contactId);
}

export function getRequestSentContactsCount() {
  return new Http().authenticated().get('/request-sent-contact-count');
}
