import React from 'react';

// API
import { ApolloProvider } from '@apollo/client/react';

// Routes
import { Navigate, Route, Router } from 'design/router';

// Hooks
import { useResponsive } from 'design/hooks';

import { client } from './apollo';
import { Header } from './header';
import { Page } from './page';
import { Session } from './session';

/** Stands in for Ki.CL when this runs on its own: a session, an API client and a router around the page. */
const Standalone: React.FunctionComponent = () => {
  // Ki.CL's header applies the theme; without that header, the stand-in does it.
  useResponsive();

  return (
    <>
      <Header />
      <Session>
        <ApolloProvider client={client}>
          <Router>
            <Route path='/'>
              <Route index element={<Navigate replace to='notification/' />} />
              <Route path='notification/' element={<Page />} />
            </Route>
          </Router>
        </ApolloProvider>
      </Session>
    </>
  );
};

export { Standalone };
