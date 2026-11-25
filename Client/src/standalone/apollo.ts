import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

/** Inside Ki.CL the bell uses the host's client; run on its own, this one talks to the gateway at `/api`. */
const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: split(
    ({ query }) => {
      const definition = getMainDefinition(query);

      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    new GraphQLWsLink(createClient({ url: `${location.origin.replace(/^http/, 'ws')}/api` })),
    new HttpLink({ uri: '/api', credentials: 'include' }),
  ),
});

export { client };
