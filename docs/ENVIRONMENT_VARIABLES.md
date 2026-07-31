# 🔐 Environment Variables Guide

Complete reference for all AFRAMP environment variables.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Detailed Configuration](#detailed-configuration)
- [Security Best Practices](#security-best-practices)
- [Platform-Specific Setup](#platform-specific-setup)

---

## Quick Reference

### Minimal Setup (Development)

```env
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_CNGN_ISSUER=GXXXXXX...
```

### Production Setup

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_CNGN_ISSUER=GXXXXXX...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_YOUR_KEY_HERE
PAYSTACK_SECRET_KEY=sk_live_YOUR_KEY_HERE
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxx
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTxxxxx
NEXT_PUBLIC_BILLS_WS_URL=wss://bills.aframp.com
```

---

## Detailed Configuration

### Core Configuration

#### `NEXT_PUBLIC_DEMO_MODE`

**Type:** Boolean (`true` | `false`)  
**Required:** Yes  
**Default:** `false`

Enables demo mode with mock wallet addresses for testing without real blockchain connections.

- **Development:** `true` (safe for testing)
- **Staging:** `false` (test with real wallets)
- **Production:** `false` (MUST be false)

⚠️ **Security Warning:** Never set to `true` in production. This bypasses wallet authentication.

```env
# Development
NEXT_PUBLIC_DEMO_MODE=true

# Production
NEXT_PUBLIC_DEMO_MODE=false
```

---

### Blockchain Configuration

#### `NEXT_PUBLIC_CNGN_ISSUER`

**Type:** String (Stellar Address)  
**Required:** Yes  
**Format:** 56-character string starting with `G`

The Stellar address that issues the cNGN (Nigerian Naira) stablecoin.

```env
# Example (Testnet)
NEXT_PUBLIC_CNGN_ISSUER=GCKFBEIYV2U22IO2BJ4KVJOIP7XPWQGQFKKWXR6DOSJBV7STMAQSMTGG

# Example (Mainnet - contact AFRAMP team)
NEXT_PUBLIC_CNGN_ISSUER=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**How to get:**
- **Testnet:** Use AFRAMP testnet issuer (see docs)
- **Mainnet:** Contact AFRAMP team or deploy your own issuer

---

### Payment Gateway Configuration

#### Paystack (Card Payments)

##### `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`

**Type:** String  
**Required:** For card payments  
**Visibility:** Client-side (public)

Paystack public key for client-side card payment initialization.

```env
# Test key (development)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE

# Live key (production)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PUBLIC_KEY_HERE
```

##### `PAYSTACK_SECRET_KEY`

**Type:** String  
**Required:** For card payments  
**Visibility:** Server-side only (secret)

Paystack secret key for server-side payment verification and processing.

```env
# Test key (development)
PAYSTACK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Live key (production)
PAYSTACK_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
```

⚠️ **Security:** Never expose this key in client-side code or commit to Git.

**Getting Paystack Keys:**
1. Sign up at [paystack.com](https://paystack.com)
2. Navigate to Settings → API Keys & Webhooks
3. Copy Test keys for development
4. Request Live keys after business verification

---

#### Flutterwave (Mobile Money & Cards)

##### `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY`

**Type:** String  
**Required:** For mobile money payments  
**Visibility:** Client-side (public)

Flutterwave public key for client-side payment initialization.

```env
# Test key (development)
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X

# Live key (production)
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
```

##### `FLUTTERWAVE_SECRET_KEY`

**Type:** String  
**Required:** For mobile money payments  
**Visibility:** Server-side only (secret)

Flutterwave secret key for server-side payment verification.

```env
# Test key (development)
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X

# Live key (production)
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
```

##### `FLUTTERWAVE_ENCRYPTION_KEY`

**Type:** String  
**Required:** For mobile money payments  
**Visibility:** Server-side only (secret)

Flutterwave encryption key for securing payment data.

```env
# Test key (development)
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTxxxxxxxxxxxxxxxx

# Live key (production)
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECKxxxxxxxxxxxxxxxx
```

**Getting Flutterwave Keys:**
1. Sign up at [flutterwave.com](https://flutterwave.com)
2. Navigate to Settings → API
3. Copy Test keys for development
4. Request Live keys after business verification

##### `FLUTTERWAVE_SECRET_HASH`

**Type:** String  
**Required:** For Flutterwave webhooks  
**Visibility:** Server-side only (secret)

The secret hash configured under Flutterwave Settings → Webhooks. Used by
`app/api/webhooks/flutterwave` to verify that incoming webhook requests
actually came from Flutterwave (see `FlutterwaveGateway.verifyWebhookSignature`
in `lib/bills/payment-gateway.ts`).

```env
FLUTTERWAVE_SECRET_HASH=your_webhook_secret_hash_here
```

##### `PAYMENT_GATEWAY`

**Type:** String (`paystack` | `flutterwave`)  
**Required:** No  
**Default:** `paystack`

Fallback gateway used by `getPaymentGatewayService()` (`lib/bills/payment-gateway.ts`)
when a request doesn't pass an explicit gateway and no per-country default
applies (see `COUNTRY_GATEWAY_MAP` in `lib/bills/gateway-config.ts`).

```env
PAYMENT_GATEWAY=paystack
```

---

### Optional Configuration

#### `NEXT_PUBLIC_BILLS_WS_URL`

**Type:** String (WebSocket URL)  
**Required:** No  
**Format:** `wss://domain.com` or `ws://localhost:port`

WebSocket URL for real-time bill payment status updates.

```env
# Development (local)
NEXT_PUBLIC_BILLS_WS_URL=ws://localhost:8080

# Production
NEXT_PUBLIC_BILLS_WS_URL=wss://bills.aframp.com
```

**When to use:**
- Real-time transaction status updates
- Live bill payment notifications
- Multi-user synchronization

**When to skip:**
- Simple deployments without real-time features
- Polling-based status checks are sufficient

---

## Security Best Practices

### 1. Never Commit Secrets

```bash
# ✅ Good - Template file
git add .env.example

# ❌ Bad - Contains secrets
git add .env.local
```

Always use `.env.example` as a template and keep `.env.local` in `.gitignore`.

### 2. Use Different Keys Per Environment

| Environment | Key Type | Purpose |
|-------------|----------|---------|
| Development | Test keys | Local testing, no real money |
| Staging | Test keys | Pre-production testing |
| Production | Live keys | Real transactions |

### 3. Rotate Keys Regularly

- Rotate API keys every 90 days
- Immediately rotate if compromised
- Use secrets management tools (AWS Secrets Manager, Azure Key Vault)

### 4. Limit Key Permissions

- Use read-only keys where possible
- Restrict API keys to specific IP addresses (if supported)
- Enable webhook signature verification

### 5. Monitor Key Usage

- Set up alerts for unusual API activity
- Review API logs regularly
- Track failed authentication attempts

---

## Platform-Specific Setup

### Vercel

**Dashboard Method:**
1. Go to Project Settings → Environment Variables
2. Add each variable
3. Select environments (Production, Preview, Development)

**CLI Method:**
```bash
vercel env add NEXT_PUBLIC_DEMO_MODE
vercel env add PAYSTACK_SECRET_KEY
```

### Railway

```bash
railway variables set NEXT_PUBLIC_DEMO_MODE=false
railway variables set NEXT_PUBLIC_CNGN_ISSUER=GXXX...
```

### Render

1. Dashboard → Environment
2. Add Environment Variable
3. Repeat for each variable

### Docker

**Method 1: .env.local file**
```bash
docker run --env-file .env.local aframp:latest
```

**Method 2: docker-compose.yml**
```yaml
services:
  aframp:
    environment:
      - NEXT_PUBLIC_DEMO_MODE=false
      - NEXT_PUBLIC_CNGN_ISSUER=${CNGN_ISSUER}
```

**Method 3: Command line**
```bash
docker run -e NEXT_PUBLIC_DEMO_MODE=false aframp:latest
```

### AWS (ECS/Fargate)

**Method 1: Task Definition**
```json
{
  "environment": [
    {
      "name": "NEXT_PUBLIC_DEMO_MODE",
      "value": "false"
    }
  ]
}
```

**Method 2: Secrets Manager**
```json
{
  "secrets": [
    {
      "name": "PAYSTACK_SECRET_KEY",
      "valueFrom": "arn:aws:secretsmanager:region:account:secret:name"
    }
  ]
}
```

---

## Validation

### Check Required Variables

```bash
# Linux/Mac
./scripts/check-env.sh

# Windows
.\scripts\check-env.ps1
```

### Manual Validation

```javascript
// In your code
if (!process.env.NEXT_PUBLIC_CNGN_ISSUER) {
  throw new Error('NEXT_PUBLIC_CNGN_ISSUER is required');
}
```

---

## Troubleshooting

### Variable Not Found

**Symptom:** `undefined` when accessing `process.env.VARIABLE_NAME`

**Solutions:**
1. Restart dev server after changing `.env.local`
2. Verify variable name spelling
3. Check if variable needs `NEXT_PUBLIC_` prefix (client-side)
4. Ensure `.env.local` is in project root

### Client-Side Variables

**Rule:** Only variables prefixed with `NEXT_PUBLIC_` are available in browser.

```env
# ✅ Available in browser
NEXT_PUBLIC_API_URL=https://api.example.com

# ❌ NOT available in browser (server-side only)
API_SECRET_KEY=secret123
```

### Docker Variables Not Loading

**Solutions:**
1. Verify `.env.local` exists
2. Check `docker-compose.yml` has `env_file: - .env.local`
3. Rebuild container: `docker-compose up --build`
4. Check logs: `docker-compose logs`

---

## Example Configurations

### Development (Local)

```env
# .env.local
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_CNGN_ISSUER=GCKFBEIYV2U22IO2BJ4KVJOIP7XPWQGQFKKWXR6DOSJBV7STMAQSMTGG
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_YOUR_KEY_HERE
PAYSTACK_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

### Staging

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_CNGN_ISSUER=GCKFBEIYV2U22IO2BJ4KVJOIP7XPWQGQFKKWXR6DOSJBV7STMAQSMTGG
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_YOUR_KEY_HERE
PAYSTACK_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxx
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTxxxxx
NEXT_PUBLIC_BILLS_WS_URL=wss://staging-bills.aframp.com
```

### Production

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_CNGN_ISSUER=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_YOUR_KEY_HERE
PAYSTACK_SECRET_KEY=sk_live_YOUR_KEY_HERE
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxx
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECKxxxxx
NEXT_PUBLIC_BILLS_WS_URL=wss://bills.aframp.com
```

---

## Support

Need help with environment configuration?

- 📖 [README.md](../README.md)
- 🚀 [DEPLOYMENT.md](../DEPLOYMENT.md)
- 🐛 [GitHub Issues](https://github.com/your-org/Aframp/issues)

---

**Secure Configuration = Secure Application** 🔐
