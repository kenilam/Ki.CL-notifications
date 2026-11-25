# CLAUDE.md

Ki.CL-notifications owns the site's notifications: a GraphQL subgraph behind [Ki.CL-api](https://github.com/kenilam/Ki.CL-api)'s gateway, and the `notification` remote, the bell any page places with `import { Notification } from 'notification'`. The rules in `Ki.CL/CLAUDE.md` apply here too. The design is under "Notifications" in `federation-plan.md` at the root of the workspace.

## Commands

```bash
make start            # first run: copies .env.template, installs, runs the standalone page
make run              # the standalone page on PORT (3400), the bell with previews and a live demo
make run.server       # the service on NOTIFICATIONS_SERVER_PORT (3401)
make registry.local DIR=../Ki.CL-api/.registry-local   # this service's record for a local gateway
make typecheck        # both workspaces
make lint
```

## Server

- `Server/schema.graphql`: `notifications`, `notificationsDismiss`, `notificationsDemo` and `notificationsUpdated`. Every root field starts with `notifications`, and `Server/Scripts/registry.ts check` fails one that doesn't. The gateway checks the session, so the service reads the visitor from the access token cookie without verifying it (`Server/visitor.ts`). It must stay private behind Cloud Run's invoker check, and `cloudbuild.yaml` stops a deploy that grants `allUsers`.
- Records (`Server/model.ts`) are one visitor's row for one source. The same rows are the list of who is waiting on a source.
- Other services publish notices to the `notifications` Pub/Sub topic (`notifications-dev` for dev), which pushes each one to `POST /internal/notices` (`Server/notices.ts`). A notice with an `owner` is that visitor's row; one without goes to everyone watching its `source`. Each carries `at`, the time of its step, and a notice older than the stored row is ignored. `{ owner, forget: true }` removes an account's rows. A notice that can't be read is acknowledged and logged, so Pub/Sub doesn't retry it forever.
- The service runs one instance, so `notificationsUpdated` publishes in-process, and the demo's allowance is kept in memory.
- `notificationsDemo` runs a short pretend job for the caller, sent through the same topic, and holds its request open until the job ends, because Cloud Run only runs code while a request is in flight.

## Client

- `Client/src/notification`: the bell. It runs its documents through the consumer's Apollo client (Apollo finds the host's provider through the shared React), reads the list again on navigation and on focus, subscribes only while something is running, and translates each notification with `useTranslation(namespace)` in its own `Suspense`. Each level maps to one icon; a running one shows a spinner.
- `Client/src/standalone`: the page this repo serves at `/notification/`, with its own session gate and Apollo client, the bell, a preview of each level, and a button that starts the demo job. It sets up i18next itself with [Ki.CL-i18n](https://github.com/kenilam/Ki.CL-i18n)'s `backend`, keeping the bundled English as the fallback, and places that remote's `LanguageSelect` in its header. Inside Ki.CL the host does both. Ki.CL proxies `/notification` here, so the page is also at that path on the site.
- Words: `Client/src/locales/en-US/notification.json` holds this repo's own, the standalone page's and the demo's. The words of a notification belong to its sender. The build sends this file to Ki.CL-i18n before deploying (the `Words` step in `cloudbuild.yaml`).
