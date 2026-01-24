# SRE Agent - Intelligent On-Call Demo

An intelligent on-call agent powered by Sentry that demonstrates a full incident response loop with AI-driven diagnostics and automated engineer paging.

## Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Demo App      │     │     Sentry      │     │     Agent       │     │     Twilio      │
│   (Next.js)     │────▶│     Cloud       │────▶│    Backend      │────▶│      API        │
│                 │     │                 │     │    (Hono)       │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └────────┬────────┘
       │                                               │                         │
       │ User triggers                                 │ LangGraph agent         │ Phone call
       │ error                                         │ analyzes & decides      ▼
       │                                               │                 ┌───────────────┐
       ▼                                               └────────────────▶│   Engineer    │
  Sentry SDK                                                             │   Phone       │
  captures error                                                         └───────────────┘
```

## Features

- **E-commerce Demo App**: Realistic store with intentional error triggers
- **LangGraph Diagnostic Agent**: AI-powered error analysis with tool execution
- **Sentry Integration**: Webhook-based error capture and routing
- **Twilio Voice Calls**: Automated paging with acknowledgment support

## Project Structure

```
sre-agent/
├── apps/
│   ├── demo-app/      # Next.js e-commerce demo
│   └── agent/         # Hono backend + LangGraph agent
├── packages/
│   └── shared/        # Shared types and constants
└── docs/              # Documentation
```

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [ngrok](https://ngrok.com/) for webhook tunneling
- Sentry account with internal integration
- Twilio account with phone number
- Anthropic API key

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd sre-agent

# Install dependencies
bun install

# Copy environment files
cp apps/demo-app/.env.local.example apps/demo-app/.env.local
cp apps/agent/.env.example apps/agent/.env

# Edit .env files with your credentials
```

### Configuration

1. **Sentry Setup**
   - Create an internal integration at Settings > Integrations
   - Enable "Alert Rule Action" permissions
   - Copy the Client Secret to `SENTRY_WEBHOOK_SECRET`
   - Set webhook URL to `https://your-ngrok-url/webhook/sentry`

2. **Twilio Setup**
   - Get Account SID and Auth Token from console
   - Purchase a phone number
   - Update `TWILIO_*` variables in `.env`

3. **Anthropic Setup**
   - Get API key from console.anthropic.com
   - Set `ANTHROPIC_API_KEY` in `.env`

### Running

```bash
# Terminal 1: Start ngrok tunnel
ngrok http 3001
# Note the https URL and update BASE_URL in apps/agent/.env

# Terminal 2: Start the agent backend
bun run --filter agent dev

# Terminal 3: Start the demo app
bun run --filter demo-app dev
```

Open http://localhost:3000 to see the demo app.

## Demo Workflow

1. **Browse Products**: Navigate the e-commerce store
2. **Trigger Errors**: Use checkout (payment), login (auth), or admin panel
3. **Agent Analyzes**: Watch the agent console for LangGraph execution
4. **Receive Call**: If severity warrants, your phone will ring
5. **Acknowledge**: Press 1 to acknowledge, 2 to escalate

## Error Types

| Page | Error Type | Severity | Action |
|------|------------|----------|--------|
| `/checkout` | Payment failure | Critical | CALL |
| `/login` | Auth error | High | CALL (if frequent) |
| `/products` | API timeout | Medium | MONITOR |
| `/products/broken_product` | UI render | Low | LOG |
| `/admin` | Manual triggers | Varies | Varies |

## Architecture

### LangGraph Agent Flow

```
START → ANALYZE → DIAGNOSE → DECIDE → END
              ↑      │
              └──────┘ (loop if needed)
```

1. **ANALYZE**: LLM interprets error, forms hypothesis
2. **DIAGNOSE**: Agent runs diagnostic tools (Python scripts, HTTP checks)
3. **DECIDE**: Based on evidence, determines CALL/MONITOR/LOG

### Routing Decision Criteria

- **CALL**: Critical severity, high frequency (>5/10min), or >10 users affected
- **MONITOR**: Medium severity with low frequency
- **LOG**: Low severity, single occurrence

## Development

```bash
# Run all services
bun run dev

# Type check
bun run typecheck

# Build
bun run build
```

## License

MIT
