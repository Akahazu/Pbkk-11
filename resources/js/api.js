const TOKEN_KEY = 'pbkk11.access_token';

export function setToken(token) {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
}

export function authHeaders(extra = {}) {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
    };
}

window.pbkkApi = { setToken, getToken, clearToken, authHeaders };
