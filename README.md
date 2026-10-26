<p align="center">
  <img src="src/public/images/logo.svg" width="200" alt="Revenual" />
</p>

# Revenual

An Express/TypeScript application that aggregates Google Play and Apple financial reports and generates invoices. It uses MongoDB, Twig and optional Stripe subscriptions.

**Status:** legacy application prepared for local development. Private credential/report examples have been removed, but application-security and dependency hardening is incomplete. Keep it on localhost while evaluating it. This is not a production-ready release. See [SECURITY.md](SECURITY.md) and [third-party licensing notes](THIRD_PARTY_NOTICES.md).

## Run locally

### Prerequisites and installation

Install Node.js **22** (see `.nvmrc`), npm, Git, and MongoDB **7** or Docker Compose. Clone `https://github.com/sandoche/revenual.git` and run commands from the checkout root:

```sh
npm ci
docker compose up -d mongo
```

Skip the Docker command if MongoDB is already running locally. Compose binds MongoDB to `127.0.0.1:27017`, with data in a named volume. This unauthenticated database is for local use only. Do not start two servers on the same port.

No Google, Apple, Stripe or Mailjet account is needed to start the app, register and sign in. Real financial report downloads require your own provider account and existing reports.

### Configure

On macOS/Linux, run `cp .env.example .env`. On Windows PowerShell, run `Copy-Item .env.example .env`.

Generate a unique session secret:

```sh
node -p "require('node:crypto').randomBytes(32).toString('hex')"
```

Paste the output after `SESSION_SECRET=` in `.env`. Leave optional integrations blank initially. The app never loads `.env.example` at runtime and rejects missing/example session secrets shorter than 32 characters.

The default development URI is `mongodb://127.0.0.1:27017/revenual`. Set `MONGODB_URI_LOCAL` if yours differs. Keep `HOST_APP=http://localhost:3000` and `PORT=3000` aligned. `HOST_LANDING_PAGE` supplies CORS/policy links; your terms/privacy pages are not included in this application.

### Build and start

```sh
npm run build
npm start
```

Open [http://localhost:3000/signup](http://localhost:3000/signup), create a local account and sign in. An empty dashboard is expected until a report provider is connected. You can skip onboarding to inspect it.

After the first build, use `npm run watch` for development. Stop MongoDB with `docker compose stop mongo`; restart it with `docker compose up -d mongo`. The volume preserves your local data.

Localhost uses **HTTP**, so you need no HTTPS certificate. The Google JSON private key below authenticates API requests; it is not an HTTPS certificate. Public hosting requires separate reverse-proxy/TLS configuration.

## Google Play: create your service account and JSON key

The connector reads the Cloud Storage JSON API using one operator-configured service account. Every connected Play account grants reporting access to that email. No Revenual-owned account, browser OAuth login or Android signing certificate is required.

1. In [Google Cloud Console](https://console.cloud.google.com/), select/create a project. Open **IAM & Admin > Service Accounts > Create service account** and choose a descriptive name, such as `financial-report-reader`. Do not grant project Owner/Editor just to access Play reports; Play permissions are separate.
2. Open the account, then **Keys > Add key > Create new key > JSON**. Download and privately store the complete JSON file. It contains a private key and is downloaded only once. If organization policy prevents key creation, contact your administrator.
3. Set its path in `.env`, for example:

   ```dotenv
   GOOGLE_APPLICATION_CREDENTIALS=keys/play-report-reader.json
   ```

   Absolute paths work too. On Windows, prefer forward slashes, e.g. `C:/private-keys/play-report-reader.json`. Relative paths resolve from the project root. `keys/` files are ignored and never copied into `dist`. Never commit or share this file.
4. In [Play Console](https://play.google.com/console/), open **Users and permissions > Invite new user** and invite the JSON file's `client_email`. Grant global **View financial data** for financial reports; bulk reporting also needs global app-information access. Publishing/order-management privileges are unnecessary. Save the permissions.
5. Open **Download reports > Financial > Copy Cloud Storage URI**. Use your account's URI, whose bucket begins with `pubsite_prod_rev_`.
6. Restart the app, open **Add account > Google Play**, confirm the displayed service-account email matches the invited user, paste your reporting URI and connect.

The connector requests only `https://www.googleapis.com/auth/devstorage.read_only`. Key/permission changes can take time to propagate. A report must already exist for the selected account/month.

Official guides: [download reports with a service account](https://support.google.com/googleplay/android-developer/answer/6135870?hl=en), [create JSON keys](https://docs.cloud.google.com/iam/docs/keys-create-delete), [Play permissions](https://support.google.com/googleplay/android-developer/answer/9844686).

## Apple reporting credentials

The app uses legacy `apple-reporter` and Apple's **Reporter access token** mechanism. It does not implement the newer App Store Connect API issuer/key IDs and `.p8` authentication. APNs/development/distribution certificates are not required for downloading these reports.

- Use an account with financial-report access, normally Admin or Finance, and verify agreements, vendor access and report availability.
- Apple's [Reporter guide](https://help.apple.com/itc/appsreporterguide/en.lproj/static.html) describes token generation/management through App Store Connect or the standalone Reporter tool. Replacing a token can invalidate an existing integration's token.
- The existing Apple form takes an email and password/app-specific password. Its legacy library attempts to acquire a Reporter token and stores the resulting token, rather than that entered password, in the account record. A `.p8` file cannot be used in this field.
- **Live compatibility of this legacy token-acquisition flow is unverified.** If Apple rejects it, review the connector before providing further credentials. Creating a modern App Store Connect API key will not make this implementation use that API. Modernization is separate work.
- Java is needed only for Apple's standalone Reporter JAR, not to run the Node application.

Reporting credentials live in MongoDB. Treat the database/backups as private. A deployed multi-user service needs further credential-storage/security work.

## Optional Stripe sandbox billing

Skip Stripe for registration/login and the free dashboard. To test checkout:

1. Select/create your own Stripe **sandbox**. Set its publishable and secret API keys as `STRIPE_PUBLIC_KEY` and `STRIPE_SECRET_KEY`. Keep `STRIPE_ENV_PROD=FALSE` locally. The publishable key is browser-facing; the secret key is private.
2. Create monthly recurring Prices for the paid plans you want to test. Fill the corresponding `STRIPE_PRICE_MAKER_EUR`, `STRIPE_PRICE_MAKER_USD`, `STRIPE_PRICE_STARTUP_EUR`, `STRIPE_PRICE_STARTUP_USD`, `STRIPE_PRICE_ENTERPRISE_EUR` and `STRIPE_PRICE_ENTERPRISE_USD` settings. Unconfigured prices cannot be purchased. The free `crafter` tier requires none. Match amounts/currencies to the plan presentation before offering billing.
3. Install the current [Stripe CLI](https://docs.stripe.com/stripe-cli), run `stripe login`, then:

   ```sh
   stripe listen --forward-to localhost:3000/subscription/webhook
   ```

4. Put that listener's signing secret into `STRIPE_WEBHOOK_SECRET_KEY` and restart the app. This differs from the API secret and from a Dashboard endpoint signing secret.
5. Keep the listener running during sandbox checkout. The app handles `checkout.session.completed` to create its local subscription record.

All keys and Prices must belong to the **same account/environment**. `STRIPE_ENV_PROD=FALSE` does not convert a live key to a sandbox key. This older billing integration has not been verified against a live sandbox in this release. Review it before live billing. See [API keys](https://docs.stripe.com/keys) and [webhook testing](https://docs.stripe.com/webhooks#test-webhook).

## Optional Mailjet password-reset email

Create a [Mailjet](https://www.mailjet.com/) account, obtain an API key/secret and verify a sender email/domain. Configure `MAILJET_USER` (API key), `MAILJET_PASSWORD` (API secret), `MAILJET_FROM_EMAIL` (verified sender) and `MAILJET_FROM_NAME` (display name).

These are API credentials, not your Mailjet login password or SMTP host. Reset links use `HOST_APP`, including `http://` locally. Without Mailjet configuration, reset email is unavailable but registration/login still work. Use an email address you control when enabling real delivery.

## Environment settings

| Setting | Purpose |
| --- | --- |
| `NODE_ENV` | `development` locally; `production` selects `MONGODB_URI`. |
| `PORT` | HTTP port, default `3000`. |
| `MONGODB_URI_LOCAL`, `MONGODB_URI` | Development and production database URIs respectively. |
| `SESSION_SECRET` | Required unique random value, minimum 32 characters. |
| `HOST_APP` | Absolute app origin for reset and checkout links. |
| `HOST_LANDING_PAGE` | Your landing/policy site and allowed CORS origin. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Optional private service-account JSON file path. |
| `BASIC_AUTH_PRIVATE_BETA` | `FALSE` by default; `TRUE` gates login/signup. |
| `BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD` | Required when beta gating is enabled. This is not a full-site access-control layer. |
| `STRIPE_ENV_PROD` | Keep `FALSE` locally. Use appropriate sandbox keys regardless of this flag. |
| `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY` | Optional Stripe key pair. |
| `STRIPE_WEBHOOK_SECRET_KEY` | Signing secret for the listener/endpoint receiving events. |
| `STRIPE_PRICE_<PLAN>_<CURRENCY>` | Paid-plan Price IDs listed above. |
| `MAILJET_USER`, `MAILJET_PASSWORD` | Optional Mailjet API key and secret. |
| `MAILJET_FROM_EMAIL`, `MAILJET_FROM_NAME` | Verified sender and display name. |
| `SENTRY_DSN` | Optional error reporting; empty disables Sentry. |

External environment variables take precedence over `.env`. No credentials are bundled. Keep environment variants, keys, reports, certificates, database exports and backups outside Git. Tests ignore `.env` and never use a configured application database.

## Tests and checks

```sh
npm test
npm run build
npm run lint
```

Tests use synthetic rows and disposable **MongoDB 7.0.45** instances on random local ports. The first run downloads/verifies the MongoDB binary; allow access to MongoDB's download server. No Docker, provider keys, `mongodump`, `mongorestore` or existing database is needed. Temporary instances/data are removed afterward. Tests do not drop an application database.

HTTP tests cover signup, logout/login, the empty dashboard and configurable beta gating. Provider authentication is mocked. Passing tests do not verify current live Apple/Stripe behavior.

`npm run lint` checks without editing; `npm run lint:fix` enables fixes explicitly. The build compiles Dart Sass/TypeScript and copies public assets and sanitized templates, never keys or environment files.

## Troubleshooting

- **Session secret missing:** create `.env`, generate a secret and restart from the checkout root. The example is never automatically loaded.
- **Database connection error:** check `docker compose ps`, URI and port conflicts. Use `127.0.0.1` if `localhost` resolves to IPv6 while MongoDB listens on IPv4.
- **Google key unreadable/invalid:** check file path, JSON format, `type=service_account`, `client_email` and private key. Use the JSON key, not a public certificate.
- **Google 403:** compare the configured email with the invited Play user, global financial permissions and reporting URI. Check Cloud Storage API access in the Cloud project; project-wide Owner access is not a substitute for Play permissions.
- **Report absent:** confirm reporting month/fiscal period, permissions and provider-side availability. Original real-world report samples are intentionally absent.
- **Mailjet rejects email:** check API credentials and sender verification. Set the correct `HOST_APP` for reset links.
- **Checkout unavailable:** configure your own sandbox keys and Prices. Original account-specific IDs have been removed.
- **Test download fails:** check network/proxy and certificate trust. Do not disable TLS verification; tests do not fall back to your application database.
- **Node Sass error:** run `npm ci` here on Node 22; this repository uses Dart Sass. Do not copy dependencies from the old application.

## Deployment and licensing

For a future deployment, build with `npm ci && npm run build`, provision production settings privately and start `node dist/server.js` or use the generic PM2 file. Configure HTTPS/reverse proxy, authenticated database, backups and a verified sender separately. No old server addresses or deployment credentials are provided.

Complete security/dependency and provider-compatibility reviews before exposing this application. Provider report formats and financial calendars may have changed since these legacy parsers were written.

Project code is [MIT](LICENSE), copyright Sandoche Adittane. Bundled assets retain separate terms. Read [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md): Highcharts and Gilroy redistribution rights still need resolution before public release.
