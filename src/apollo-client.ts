import { ApolloClient, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import Cookies from 'universal-cookie';
import dayjs from 'dayjs';
import jwt from 'jwt-decode';
import { setTokenCookie } from './helpers/token.helper';

const cookies = new Cookies();

const aToken = process.env.REACT_APP_ACCESS_TOKEN || 'ap-at';
const rToken = process.env.REACT_APP_REFRESH_TOKEN || 'ap-rt';

const apiUrlLink = createUploadLink({
  uri: UMI_APP_API,
});

const generateNewToken = async (refreshToken: string) => {
  if (process.env.REACT_APP_AUTH_API) {
    const sid = cookies.get(process.env.REACT_APP_SESSION_ID || 'abf-sid');
    const res: any = await fetch(process.env.REACT_APP_AUTH_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({
        query: `
                      mutation RefreshAccessToken ($refreshToken:RefreshTokenInput) {
                          refreshAccessToken (refreshToken:$refreshToken) {
                                  a
                              }
                          }
                  `,
        variables: { refreshToken: { macAddress: sid } },
      }),
    });

    const result = await res.json();
    const newAccessToken =
      result.data && result.data.refreshAccessToken ? result.data.refreshAccessToken.a : null;
    if (newAccessToken) {
      setTokenCookie(aToken, newAccessToken);
      return newAccessToken;
    } else {
      const isProd = process.env.NODE_ENV === 'production';
      cookies.remove(rToken, {
        path: '/',
        domain: isProd ? process.env.REACT_APP_COOKIE_DOMAIN : 'localhost',
      });
    }
  }
  return;
};

const contextLink = setContext(async (_, { headers }) => {
  // get the authentication token from cookies if it exists
  let token = cookies.get(aToken);
  const refreshToken = cookies.get(rToken);
  // Attempt to refresh token when remaining expiry time less than 1 minute.
  if (token && refreshToken) {
    const { exp }: any = jwt.jwtDecode(token);
    const expiryTime = dayjs.unix(exp);
    if (expiryTime.diff(dayjs(), 'minutes') < 50) {
      //refresh token
      token = await generateNewToken(refreshToken);
    }
  } else if (refreshToken) {
    token = await generateNewToken(refreshToken);
  }

  // return the headers to the context so httpLink can read them
  const authHeaders = token
    ? {
        ...headers,
        Authorization: `Bearer ${token}`,
      }
    : headers;

  return { headers: authHeaders };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`),
    );

  if (networkError) console.log(`[Network error]: ${networkError}`);
});

const client = new ApolloClient({
  link: contextLink.concat(errorLink).concat(apiUrlLink),
  cache: new InMemoryCache(),
});

export default client;
