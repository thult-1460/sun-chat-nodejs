import Http from './../utils/Http';

export function getContactRequest(page) {
  return new Http().authenticated().get('/my-contact-request?page=' + page);
}

export function getNumberContactRequest() {
  return new Http().authenticated().get('/my-contact-request-number');
}

export function rejectContact(contactIds) {
  return new Http().authenticated().post('/reject-contact', contactIds);
}
