import Http from './../utils/Http';

export function getContactRequest(page) {
  return new Http().authenticated().get('/my-contact-request?page=' + page);
}

export function getNumberContactRequest() {
  return new Http().authenticated().get('/my-contact-request-number');
}
