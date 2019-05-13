import jwt_decode from 'jwt-decode';

export function checkExpiredToken () {
    if (localStorage.getItem('token') == null) {
        return false;
    }
    let decoded = jwt_decode(localStorage.getItem('token'));
    let currentTime = Date.now() / 1000;

    if (parseFloat(decoded.exp) > parseFloat(currentTime)) {
        return true;
    }
    localStorage.removeItem('token');

    return false;
}
