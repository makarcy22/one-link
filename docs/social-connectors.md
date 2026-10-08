# Social connectors setup

One Link connects publishing accounts through each platform's official OAuth.
Tokens are encrypted (AES-256-GCM) with `SOCIAL_TOKEN_KEY` before storage —
raw tokens never sit in the database.

## Step 0: token vault key (required)

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Put the output in `.env` as `SOCIAL_TOKEN_KEY`. Without it, every connect
attempt fails with a clear error instead of storing anything insecurely.

## Step 1: TikTok

1. Go to the TikTok Developers portal and create an app.
2. Add the **Login Kit** and request the scopes `user.info.basic` and `video.upload`.
3. Register the redirect URI: `http://localhost:3000/api/social/tiktok/callback`
4. Copy the Client Key and Client Secret into `.env` as `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET`.
5. Note: publishing to other people's accounts requires TikTok's app review; your own test users work first.

## Step 2: Facebook + Instagram (one Meta app)

1. Create an app at Meta for Developers (Business type).
2. Add **Facebook Login** with redirect URIs:
   - `http://localhost:3000/api/social/facebook/callback`
   - `http://localhost:3000/api/social/instagram/callback`
3. Request: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`.
4. Copy the App ID and App Secret into `.env` as `META_APP_ID` / `META_APP_SECRET`.
5. Note: posting scopes need Meta app review; test users and your own Pages work first.

## Step 3: LinkedIn

1. Create an app at LinkedIn Developers, add the **Sign In with LinkedIn** and **Share on LinkedIn** products.
2. Register the redirect URI: `http://localhost:3000/api/social/linkedin/callback`
3. Copy the Client ID and Client Secret into `.env` as `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`.

## Step 4: connect inside One Link

1. Restart the API so new `.env` values load.
2. Open Profile → Connected accounts → **Connect** next to a platform.
3. Approve access on the platform's site — you return with the account linked.
4. **Refresh** re-issues tokens where the platform supports it; otherwise reconnect.

## Production notes (review pass)

- Replace `localhost` redirect URIs with your public API domain everywhere (provider consoles + `.env`).
- Strict OAuth handling is already in place (single-use Redis states, 10-minute expiry).
- Publishing calls move from the mock connector to these stored tokens per platform.
