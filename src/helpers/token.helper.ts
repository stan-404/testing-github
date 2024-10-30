import Cookies from 'universal-cookie';

const cookies = new Cookies();

export const setTokenCookie = (key: string, value: string) => {
  const isProd = process.env.NODE_ENV === 'production';
  cookies.set(key, value, {
    maxAge: key === (process.env.REACT_APP_ACCESS_TOKEN || 'abf-at') ? 3600 : 18000, //refresh token keep for a week
    domain: isProd ? process.env.REACT_APP_COOKIE_DOMAIN : 'localhost',
    secure: isProd ? true : undefined,
    sameSite: isProd ? 'lax' : undefined,
    path: '/',
  });
};
