# One Link v2 update: what changed and what you must do

## What is new
- **Per-network versions.** One draft becomes a version for each network, with character limits, hashtag limits and warnings. You review and edit each one before it goes out (`/api/variants/preview`, `post_variants` table).
- **Facebook Page publishing.** The first real publisher. Connect Facebook, choose a Page, and scheduled posts are sent to that Page. Other networks are prepared and you get a reminder (`packages/platform-connectors`).
- **Honest status.** The old fake "published" result is gone. A post is only "Posted" when Facebook accepts it. `PUBLISH_DRY_RUN=true` runs the whole flow without sending anything, and marks the result as a test run.
- **Hashtag scoring.** Suggestions are scored by fit to your post, niche and region, with the reason shown. Popularity is not treated as fit.
- **Trends.** A curated guide (not live data) with hook, format and hashtags, plus a calendar of dates worth posting about. The screen says it is curated and shows the review date.
- **Templates, saved captions, onboarding.** Six graphic layouts, caption starters, a personal library, and a four-step setup.
- **Notifications.** A bell for posted, failed, reminders, billing and welcome messages.
- **Payments.** Paystack (unchanged for existing subscribers), Stripe (cards, worldwide), Flutterwave (card, bank, mobile money in several African countries), and a manual route for South Sudan where you confirm a mobile-money or bank payment by hand.
- **Design system v2.** Light and dark themes, new shell, phone tab bar, onboarding, toasts.

## Do these in order
1. Back up your database.
2. Apply the files with `apply-update.ps1` (it makes a backup first and asks before changing anything).
3. `npm install` at the project root. This also builds the two shared packages.
4. Apply the new tables: run `apps/api/migrations/007_v2_features.sql`, `008_payment_currency.sql` and `009_payment_quotes.sql`, in that order, against your database. All are safe to run twice.
5. Add the settings below to your own `.env` (this update never touches it).
6. Start the API, the worker and the web app.

## New settings (names only)
| Name | What it does | Needed for |
|---|---|---|
| `META_GRAPH_VERSION` | Facebook API version. Default `v24.0`. | optional |
| `PUBLISH_DRY_RUN` | `true` = test mode, nothing is sent. | testing |
| `R2_PUBLIC_URL` | Public address of your file storage. Needed to post pictures to Facebook. | pictures |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Card payments worldwide. Webhook URL: `/api/billing/webhook/stripe`. | Stripe |
| `FLW_SECRET_KEY`, `FLW_SECRET_HASH` | Flutterwave. Webhook URL: `/api/billing/webhook/flutterwave`. | Flutterwave |
| `ADMIN_EMAILS` | Comma-separated owner emails allowed to confirm manual payments. | manual payments |
| `MANUAL_PAY_INSTRUCTIONS` | The text people see: where to send money. | manual payments |
| `LOCAL_PRICES` | Prices in local money, as JSON, for example `{"SSP":{"creator":<amount>,"business":<amount>}}`. You set every amount yourself. One Link never converts currencies. | local currency |
| `FX_MARGIN_PERCENT` | Extra percent added to automatic local prices, as a buffer for rate swings. Default 0. | automatic rates |
| `FX_URL` | Rate source. Default is the free ExchangeRate-API open endpoint. | optional |
| `PRICE_CREATOR_USD`, `PRICE_BUSINESS_USD` | Override the launch prices ($15 and $49 are placeholders). | pricing |

Existing names (`PAYSTACK_*`, `META_APP_ID`, `META_APP_SECRET`, `SOCIAL_TOKEN_KEY`, and so on) stay as they are.

## Facebook Page setup
1. In your Meta app, request `pages_show_list`, `pages_read_engagement` and `pages_manage_posts`. While the app is in development mode only people with a role on the app can connect. Public use needs Meta App Review.
2. Add the redirect address `https://YOUR-API/api/social/facebook/callback`.
3. In One Link: Profile, Connect Facebook, then choose the Page.
4. Try it first with `PUBLISH_DRY_RUN=true`.

## Manual payments (South Sudan)
Neither Stripe nor Flutterwave serves South Sudan directly. People see "Mobile money or bank transfer" first, pay you, enter the transaction reference, and you confirm it in Profile (owner only). A confirmed payment turns the plan on for one month.

## Dollars or local money, with automatic rates
After a person picks a payment method, they are asked whether to pay in dollars or in their own money.
- **Which country.** One Link works it out in this order: the country the person chose in Profile, the country the network reports, the region they picked at setup, then their device time zone. They can always change it.
- **Which price.** Local prices are the dollar price times today's exchange rate, rounded up to a tidy number. Rates come from a free public feed (ExchangeRate-API, about one update a day), are refreshed at most every 6 hours, and the last good rates are used for up to 7 days if the feed is down. After that only dollars are offered. The screen says "about", shows the date, and credits the feed.
- **Your own prices win.** Anything you set in `LOCAL_PRICES` replaces the automatic price for that currency.
- **The amount is locked.** For Flutterwave, the amount shown is stored when payment starts (`payment_quotes`), and the payment is only accepted if it matches that amount. For manual payments, the amount shown is kept if the rate moved less than 5%.
- **Which methods take local money.** Mobile money or bank transfer takes any currency listed (SSP, UGX, KES, TZS, RWF, ETB, NGN, GHS, ZAR). Flutterwave takes UGX, KES, TZS, RWF, NGN, GHS, ZAR. Stripe and Paystack subscriptions stay in dollars.
- **Important for South Sudan.** The feed gives the official rate. Real market rates for the South Sudanese pound can differ a lot from it and change fast. Check the SSP price the app shows against what you would really accept. Use `FX_MARGIN_PERCENT` as a buffer, or set `LOCAL_PRICES` for SSP by hand.

## Known limits
- Instagram, TikTok, LinkedIn and X can be connected but do not post automatically yet. They are prepared and you get a reminder.
- Pictures can only be posted to Facebook when files are stored on a public address (R2). Local disk storage cannot be reached by Facebook, and the app says so instead of dropping the picture.
- Trends are curated by hand, not live. Review `packages/shared/src/trends-data.ts` each month.
- Stripe, Flutterwave and Facebook were tested with simulated responses, not with live accounts.
