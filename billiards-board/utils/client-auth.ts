export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt');
}

export function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getUserIdFromToken() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('userId');
  if (stored) return stored;
  const token = getAuthToken();
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.sub as string | null;
  } catch {
    return null;
  }
}
