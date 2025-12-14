export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt');
}

export function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
