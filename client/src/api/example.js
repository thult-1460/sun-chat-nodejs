import Http from './../utils/Http';

export function getData() {
    return new Http().get('/users/hello')
}
