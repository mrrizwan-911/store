import { cookies } from 'next/headers';
import { verifyRefreshToken } from './jwt';

export async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('refreshToken')?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyRefreshToken(token);
    return payload;
  } catch (error) {
    return null;
  }
}
