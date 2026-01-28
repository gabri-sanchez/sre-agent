# Setup Guide

This guide walks you through setting up the SRE Agent demo from scratch.

## Prerequisites

### Required Tools

1. **Bun** (v1.0 or later)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **ngrok** (for webhook tunneling)
   ```bash
   # macOS
   brew install ngrok

   # Or download from https://ngrok.com/download
   ```

3. **Python 3** (for diagnostic scripts)
   ```bash
   # Verify installation
   python3 --version
   ```

### Required Accounts

1. **Sentry** - https://sentry.io
2. **Vapi** - https://vapi.ai
3. **Anthropic** - https://console.anthropic.com

## Step 1: Clone and Install

```bash
git clone <repo-url>
cd sre-agent
bun install
```

## Step 2: Sentry Configuration

### Create a Project

1. Go to Sentry dashboard
2. Create a new project (choose Next.js platform)
3. Copy the DSN (looks like `https://xxx@xxx.ingest.sentry.io/xxx`)

### Create Internal Integration

1. Go to Settings > Integrations > Internal Integrations
2. Click "Create New Integration"
3. Configure:
   - Name: "SRE Agent"
   - Permissions: Check "Alert Rule Action"
   - Webhooks: Enable webhooks
4. Save and note the **Client Secret**

### Configure Webhook

After starting ngrok (see Step 5), update the webhook URL:

1. Go to your integration settings
2. Set Webhook URL: `https://your-ngrok-url.ngrok.io/webhook/sentry`
3. Enable for: Issue events

### Create Alert Rule

1. Go to Alerts > Create Alert
2. Choose "Issues"
3. Configure:
   - When: A new issue is created
   - Filter: (optional) specific services
   - Action: Send notification via "SRE Agent" integration
4. Save

## Step 3: Vapi Configuration

### Get Credentials

1. Go to https://dashboard.vapi.ai
2. Copy your API key from the dashboard

### Get a Phone Number

1. Go to Phone Numbers in the Vapi dashboard
2. Buy or import a phone number with Voice capability
3. Note the Phone Number ID (used in `VAPI_PHONE_NUMBER_ID`)

### Configure Webhook

After starting ngrok (see Step 6), configure the webhook on your phone number:

1. Select your phone number in the Vapi dashboard
2. Set Server URL to: `https://your-ngrok-url.ngrok.io/vapi/webhook`
3. Save the configuration

## Step 4: Anthropic Configuration

1. Go to https://console.anthropic.com
2. Create an API key
3. Copy the key (starts with `sk-ant-`)

## Step 5: Environment Configuration

### Demo App (.env.local)

```bash
cd apps/demo-app
cp .env.local.example .env.local
```

Edit `apps/demo-app/.env.local`:
```
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Agent Backend (.env)

```bash
cd apps/agent
cp .env.example .env
```

Edit `apps/agent/.env`:
```
PORT=3001
BASE_URL=https://your-ngrok-url.ngrok.io  # Update after starting ngrok
NODE_ENV=development

ANTHROPIC_API_KEY=sk-ant-xxx
SENTRY_WEBHOOK_SECRET=your-client-secret-from-step-2

VAPI_API_KEY=your-vapi-api-key
VAPI_PHONE_NUMBER_ID=your-phone-number-id

# Update with your phone number for testing
ENGINEER_PAYMENTS_PHONE=+1XXXXXXXXXX
```

## Step 6: Start Services

### Terminal 1: ngrok

```bash
ngrok http 3001
```

Copy the `https://xxx.ngrok.io` URL and:
1. Update `BASE_URL` in `apps/agent/.env`
2. Update webhook URL in Sentry integration settings
3. Update Server URL on your Vapi phone number to `https://xxx.ngrok.io/vapi/webhook`

### Terminal 2: Agent Backend

```bash
bun run --filter agent dev
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║                    SRE Agent Backend                       ║
╠═══════════════════════════════════════════════════════════╣
║  Environment: development                                  ║
║  Port: 3001                                                ║
╚═══════════════════════════════════════════════════════════╝

Server running at http://localhost:3001
```

### Terminal 3: Demo App

```bash
bun run --filter demo-app dev
```

Open http://localhost:3000

## Step 7: Test the Flow

1. Open the demo app at http://localhost:3000
2. Navigate to a product and add to cart
3. Go to checkout and click "Complete Purchase"
4. Watch the agent terminal for processing logs
5. If configured correctly, your phone should ring!

## Troubleshooting

### Webhook not receiving events

- Check ngrok is running and URL is correct
- Verify Sentry integration webhook URL
- Check agent logs for incoming requests

### Vapi call not working

- Verify phone number format (`+1XXXXXXXXXX`)
- Check Vapi account has credits
- Verify API key and Phone Number ID are correct
- Ensure webhook URL is configured on the phone number in Vapi dashboard

### Agent errors

- Ensure `ANTHROPIC_API_KEY` is valid
- Check Python 3 is installed (`python3 --version`)

### Sentry errors not appearing

- Verify `NEXT_PUBLIC_SENTRY_DSN` is correct
- Check browser console for Sentry initialization
- Try the admin panel's direct error triggers

## Next Steps

- Customize engineer phone numbers
- Modify routing rules in the agent
- Add more diagnostic tools
- Integrate with your own services
