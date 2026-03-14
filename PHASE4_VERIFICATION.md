# ✅ PHASE 4 — VERIFICATION & TESTING
## FeedinGreen · Post-Deployment Verification Guide

---

## PERFORMANCE VERIFICATION

### 1. PageSpeed — Target: 85+
```
Open: https://pagespeed.web.dev
URL:  https://feedingreen.up.railway.app/landing
```

### 2. TTFB — Target: < 500ms
```bash
curl -o /dev/null -s -w "TTFB: %{time_starttransfer}s\n" \
  https://feedingreen.up.railway.app/landing
```

### 3. Compression — Look for "Content-Encoding: gzip"
```bash
curl -H "Accept-Encoding: gzip" -I \
  https://feedingreen.up.railway.app/landing
```

### 4. Bundle Size — Target: initial chunk < 500kb gzipped
```bash
cd smart-farm-frontend
ng build --configuration production --stats-json
npx webpack-bundle-analyzer dist/smart-farm-frontend/stats.json
```

---

## SECURITY VERIFICATION

### 5. Security Headers — Target: Grade A or A+
```
Open: https://securityheaders.com/?q=feedingreen.up.railway.app
```

### 6. Rate Limiting — Expect 429 after rapid requests
```bash
for i in {1..6}; do
  curl -s -o /dev/null -w "Request $i: Status %{http_code}\n" \
    -X POST https://feedingreen.up.railway.app/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}';
done
```
**Expected:** First 3 requests return `401`, then `429` (Too Many Requests)

### 7. Protected Route Without Token — Expect 401
```bash
curl -s -w "Status: %{http_code}\n" \
  https://feedingreen.up.railway.app/api/v1/farms
```
**Expected:** `401 Unauthorized`

### 8. CORS with Bad Origin — Expect no allow header
```bash
curl -H "Origin: https://evil.com" -I \
  https://feedingreen.up.railway.app/api/v1/health
```
**Expected:** No `Access-Control-Allow-Origin` header in response

### 9. Health Endpoint
```bash
curl https://feedingreen.up.railway.app/api/v1/health
```
**Expected:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-05T...",
  "uptime": 12345.67,
  "version": "1.0.0"
}
```

### 10. Refresh Token Flow
```bash
# Login and capture cookies
curl -c cookies.txt -X POST \
  https://feedingreen.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Refresh using cookie
curl -b cookies.txt -X POST \
  https://feedingreen.up.railway.app/api/v1/auth/refresh
```
**Expected:** New access token cookie set, `{ "ok": true }`

---

## DATABASE VERIFICATION

### 11. Slow Query Detection
Temporarily add to TypeORM config:
```typescript
logging: ['query', 'slow'],
```
Deploy, hit the app, check Railway logs.
**Target:** No query over 100ms

### 12. Connection Pool Load Test
```bash
npx autocannon -c 50 -d 10 \
  https://feedingreen.up.railway.app/api/v1/health
```
**Expected:** No connection timeout errors, p99 latency < 500ms

---

## EXPECTED SCORE IMPROVEMENTS

| Metric | Before | Target | Actual |
|--------|--------|--------|--------|
| Performance | 58 | 85–92 | ___ |
| Best Practices | 83 | 95–100 | ___ |
| SEO | 96 | 96–100 | ___ |
| Accessibility | 100 | 100 | ___ |
| LCP | ___ms | <2500ms | ___ |
| TTFB | ___ms | <500ms | ___ |
| TBT | ___ms | <200ms | ___ |
| CLS | ___ | <0.1 | ___ |

---

## POST-DEPLOY CHECKLIST

- [ ] UptimeRobot free monitor set up — pinging `/api/v1/health` every 5 min
- [ ] All Railway environment variables confirmed in dashboard:
  - [ ] `DATABASE_URL` (with `?sslmode=require`)
  - [ ] `JWT_SECRET` (min 32 chars)
  - [ ] `REFRESH_JWT_SECRET` (different from JWT_SECRET)
  - [ ] `NODE_ENV=production`
  - [ ] `CORS_ORIGIN=https://feedingreen.up.railway.app`
- [ ] `.gitignore` file present and includes `.env`
- [ ] No API keys hardcoded in frontend environment files
- [ ] PageSpeed re-run — screenshot saved
- [ ] securityheaders.com — Grade A or better achieved
- [ ] No console errors in browser DevTools on `/landing`
- [ ] Mobile PageSpeed also tested
- [ ] Rate limit tested — 429 confirmed on brute-force attempt
- [ ] CORS tested — evil.com origin rejected
- [ ] Refresh token flow tested end-to-end
- [ ] Password hash not visible in any API response

---

## DEPLOYMENT SUMMARY TEMPLATE

> After completing all phases, fill in and share this with your team:

```
## FeedinGreen Deployment Summary — [DATE]

### Changes Made
- [Phase 2] Performance: Removed unused packages (ffmpeg, duplicate charting),
  tightened build budgets, added cache-control headers, added SSR (if implemented)
- [Phase 3] Security: Applied global rate limiting with ThrottlerGuard, 
  hardened JWT (15m access + 7d refresh tokens), locked CORS in production, 
  added @Exclude on password hashes with ClassSerializer, increased bcrypt 
  rounds to 12, added @Index on User entity, created RBAC guard,
  removed hardcoded API keys, created .gitignore and .env.example

### Results
| Metric | Before | After |
|--------|--------|-------|
| Performance | 58 | ___ |
| Best Practices | 83 | ___ |
| Security Headers Grade | ___ | ___ |
| Rate Limiting | Not enforced | Enforced (429 confirmed) |
| JWT Expiry | 24h (no refresh) | 15m access + 7d refresh |
| Password Hash Visibility | Exposed | Hidden (@Exclude) |

### Environment Variables Required
JWT_SECRET, REFRESH_JWT_SECRET, DATABASE_URL, NODE_ENV, CORS_ORIGIN

### Monitoring
UptimeRobot pinging /api/v1/health every 5 minutes
```

---

> **Phase 4 guide complete.**
