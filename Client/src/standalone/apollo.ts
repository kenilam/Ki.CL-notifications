import { ApolloClient, CombinedGraphQLErrors, HttpLink, InMemoryCache, split } from '@apollo/client';
import { ErrorLink } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { from, mergeMap, of, throwError } from 'rxjs';

import { SESSION_ENDED } from 'notification/constants';

let refreshing: Promise<boolean> | undefined;

/** One renewal for every request that failed together. */
const refresh = () =>
  (refreshing ??= fetch('/api', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName: 'kicl_refreshToken', query: 'mutation kicl_refreshToken { refreshToken }' }),
  })
    .then((response) => response.json())
    .then((body: { data?: { refreshToken?: boolean | null } }) => body.data?.refreshToken === true)
    .catch(() => false)
    .finally(() => {
      refreshing = undefined;
    }));

/**
 * The gateway answers EXPIRED when the access token has run out: renew it and
 * try once more. A session that ended, or one that needs the human check,
 * sends the page back to the session gate.
 */
const renewal = new ErrorLink(({ error, result, operation, forward }) => {
  const codes = CombinedGraphQLErrors.is(error) ? error.errors.map(({ extensions }) => extensions?.code) : [];

  if (codes.includes('UNAUTHORIZED') || codes.includes('CAPTCHA_REQUIRED')) {
    dispatchEvent(new Event(SESSION_ENDED));
    return;
  }

  if (!codes.includes('EXPIRED') || operation.getContext().renewed) {
    return;
  }

  return from(refresh()).pipe(
    mergeMap((renewed) => {
      if (!renewed) {
        dispatchEvent(new Event(SESSION_ENDED));
        return result ? of(result) : throwError(() => error);
      }

      operation.setContext({ renewed: true });
      return forward(operation);
    }),
  );
});

/** Inside Ki.CL the bell uses the host's client; run on its own, this one talks to the gateway at `/api`. */
const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: renewal.concat(
    split(
      ({ query }) => {
        const definition = getMainDefinition(query);

        return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
      },
      new GraphQLWsLink(createClient({ url: `${location.origin.replace(/^http/, 'ws')}/api` })),
      new HttpLink({ uri: '/api', credentials: 'include' }),
    ),
  ),
});

export { client };
