const CLIENT_USER_ID_KEY = 'novax-client-user-id';

export function getClientUserId(): string {
  const existing = localStorage.getItem(CLIENT_USER_ID_KEY);
  if (existing) {
    return existing;
  }

  const generated = `guest_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(CLIENT_USER_ID_KEY, generated);
  return generated;
}
