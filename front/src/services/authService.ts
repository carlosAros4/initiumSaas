const API_URL = import.meta.env.VITE_API_URL;

export async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message ?? 'Error al iniciar sesión');
  }

  const data = await response.json();
  return data.token as string;
}

export async function introspect(
  token: string
): Promise<{ sub: string; email: string; iat: number; exp: number }> {
  const response = await fetch(`${API_URL}/auth/introspect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error('Token inválido o expirado');
  }

  return response.json();
}
