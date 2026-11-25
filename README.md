# Ki.CL-notifications

The notifications of [ki-cl.com](https://ki-cl.com): a GraphQL subgraph that keeps them, and a federated bell that shows them.

Work that carries on after its page is left, such as a sheet being read or a picture being drawn, sends a notice for each step through Pub/Sub. This service keeps one row for each visitor and piece of work, and the bell shows them, links each one to its page, and follows the work while it runs.

A page adds the bell with `import { Notification } from 'notification'`. Run on its own, the repo serves a page with the bell, a preview of each kind of notification and a demo job.

See `CLAUDE.md` for how it works and how to run it.
