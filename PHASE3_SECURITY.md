# 🔒 PHASE 3 — SECURITY & BEST PRACTICES
## FeedinGreen · Security Hardening Guide

---

## Overview

| Fix | Title | Severity | Effort | Status |
|-----|-------|----------|--------|--------|
| S1 | Helmet Security Headers | SKIP | — | Already configured ✅ |
| S2 | Rate Limiting — Apply ThrottlerGuard Globally | CRITICAL | 10 min | 🔧 TODO |
| S3 | Global Validation Pipe | SKIP | — | Already configured ✅ |
| S4 | JWT + Refresh Token Security | CRITICAL | 30 min | 🔧 TODO |
| S5 | CORS Lockdown | HIGH | 5 min | 🔧 TODO |
| S6 | Password Hashing Audit | CRITICAL | 15 min | 🔧 TODO |
| S7 | SQL Injection Audit | SKIP | — | No raw queries found ✅ |
| S8 | PostgreSQL Index Audit | HIGH | 10 min | 🔧 TODO |
| S9 | Angular Security Audit | HIGH | 20 min | 🔧 TODO |
| S10 | Environment & Secrets Audit | CRITICAL | 15 min | 🔧 TODO |
| S11 | Role-Based Access Control (RBAC) | HIGH | 20 min | 🔧 TODO |

---

## FIX S1 — Helmet Security Headers
**Already secure — skipping.** ✅

Helmet v8.1.0 configured in `main.ts:27-44` with:
- CSP directives ✅
- HSTS with 1-year maxAge ✅
- Cross-origin resource policy ✅

---

## FIX S2 — Rate Limiting — Apply ThrottlerGuard Globally
**Layer:** NestJS | **Severity:** CRITICAL | **Effort:** 10 min

### Problem
`ThrottlerModule` is imported with `[{ ttl: 60, limit: 20 }]`, but **no ThrottlerGuard is applied** — rate limiting is declared but not enforced.

### Files
- `smart-farm-backend/src/app.module.ts`
- `smart-farm-backend/src/modules/auth/auth.controller.ts`

### Step 1: Apply ThrottlerGuard globally in `app.module.ts`

#### BEFORE
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 20 }]),
    // ...
  ],
})
```

#### AFTER
```typescript
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    // ...
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
```

### Step 2: Add strict throttle on auth endpoints in `auth.controller.ts`

```typescript
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  // ...

  @Throttle({ short: { limit: 3, ttl: 10000 } })
  @Post('login')
  async login() { /* ... */ }

  @Throttle({ short: { limit: 2, ttl: 10000 } })
  @Post('logout')
  async logout() { /* ... */ }

  @SkipThrottle()
  @Get('csrf')
  async csrf() { /* ... */ }
}
```

### Why it matters
Without the guard applied globally, the ThrottlerModule does nothing — attackers can brute-force login with unlimited attempts.

---

## FIX S3 — Global Validation Pipe
**Already secure — skipping.** ✅

`ValidationPipe` configured with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` in `main.ts:51-60`.

---

## FIX S4 — JWT + Refresh Token Security
**Layer:** NestJS | **Severity:** CRITICAL | **Effort:** 30 min

### Problem
1. JWT secret has a **fallback `'your-secret-key'`** — if `JWT_SECRET` env isn't set, anyone can forge tokens
2. Access token expires in **24h** — far too long (should be 15m)
3. **No refresh token pattern** — no token rotation, no `/auth/refresh` endpoint
4. JWT secret used in **3 different files** with the same fallback

### Files
- `smart-farm-backend/src/modules/auth/auth.module.ts`
- `smart-farm-backend/src/modules/auth/auth.service.ts`
- `smart-farm-backend/src/modules/auth/auth.controller.ts`
- `smart-farm-backend/src/modules/auth/strategies/jwt.strategy.ts`
- `smart-farm-backend/src/modules/users/users.module.ts`
- `smart-farm-backend/src/modules/admin/admin.module.ts`

### Step 1: Fix JWT secret — remove fallback

In ALL files using JWT_SECRET:
```typescript
// BEFORE (DANGEROUS):
secret: process.env.JWT_SECRET || 'your-secret-key',

// AFTER (SAFE):
secret: process.env.JWT_SECRET,
// App will fail to start if JWT_SECRET is not set — this is correct behavior
```

### Step 2: Reduce access token expiry to 15 minutes

In `auth.module.ts`:
```typescript
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.getOrThrow('JWT_SECRET'),
    signOptions: { expiresIn: '15m' },
  }),
}),
```

### Step 3: Add refresh token to `auth.service.ts`

```typescript
async login(user: SafeUser) {
  const payload = { email: user.email, sub: user.user_id, role: user.role };
  
  const accessToken = this.jwtService.sign(payload);
  const refreshToken = this.jwtService.sign(payload, {
    secret: process.env.REFRESH_JWT_SECRET,
    expiresIn: '7d',
  });

  return { user, accessToken, refreshToken };
}

async refreshAccessToken(refreshToken: string) {
  try {
    const payload = this.jwtService.verify(refreshToken, {
      secret: process.env.REFRESH_JWT_SECRET,
    });
    const user = await this.validateUserById(payload.sub);
    if (!user) throw new UnauthorizedException();
    
    const newPayload = { email: user.email, sub: user.user_id, role: user.role };
    return { accessToken: this.jwtService.sign(newPayload) };
  } catch {
    throw new UnauthorizedException('Invalid refresh token');
  }
}
```

### Step 4: Update `auth.controller.ts` with refresh/logout endpoints

```typescript
@Post('login')
async login(@Body() loginDto: LoginUserDto, @Res({ passthrough: true }) res: Response) {
  const user = await this.authService.validateUser(loginDto);
  const { accessToken, refreshToken, user: safeUser } = await this.authService.login(user);
  
  // Access token in HttpOnly cookie (short-lived)
  res.cookie('sf_auth', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });
  
  // Refresh token in separate HttpOnly cookie (long-lived)
  res.cookie('sf_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth/refresh',
  });
  
  return { user: safeUser };
}

@Post('refresh')
async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
  const refreshToken = req.cookies?.['sf_refresh'];
  if (!refreshToken) throw new UnauthorizedException('No refresh token');
  
  const { accessToken } = await this.authService.refreshAccessToken(refreshToken);
  
  res.cookie('sf_auth', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
  
  return { ok: true };
}

@Post('logout')
async logout(@Res({ passthrough: true }) res: Response) {
  res.clearCookie('sf_auth', { path: '/' });
  res.clearCookie('sf_refresh', { path: '/api/v1/auth/refresh' });
  return { ok: true };
}
```

### Step 5: Add `REFRESH_JWT_SECRET` to Railway env vars

Ensure these are set in Railway Dashboard:
```
JWT_SECRET=<min-32-char-random-string>
REFRESH_JWT_SECRET=<different-32-char-random-string>
```

### Why it matters
The fallback `'your-secret-key'` means if `JWT_SECRET` env var is ever unset, attackers can forge admin tokens. 24h expiry with no rotation means a stolen token is valid for an entire day.

---

## FIX S5 — CORS Lockdown
**Layer:** NestJS | **Severity:** HIGH | **Effort:** 5 min

### Problem
If `CORS_ORIGIN=*` is set, the current code accepts ALL origins dynamically — this bypasses CORS entirely even with `credentials: true`.

### Files
- `smart-farm-backend/src/main.ts`

### BEFORE (lines 78-84)
```typescript
if (corsOrigin === '*') {
  allowedOrigins = (origin, callback) => {
    callback(null, true); // Accepts ANY origin
  };
}
```

### AFTER
```typescript
if (corsOrigin === '*') {
  // In production, NEVER allow wildcard with credentials
  if (process.env.NODE_ENV === 'production') {
    logger.warn('⚠️ CORS_ORIGIN=* is not allowed in production. Using defaults.');
    allowedOrigins = defaultOrigins;
  } else {
    allowedOrigins = (origin, callback) => {
      callback(null, true);
    };
    logger.warn('⚠️ CORS: Allowing all origins in development mode');
  }
}
```

### Why it matters
Wildcard CORS with credentials allows any malicious site to make authenticated requests on behalf of your users.

---

## FIX S6 — Password Hashing Audit
**Layer:** NestJS | **Severity:** CRITICAL | **Effort:** 15 min

### Problem
1. bcrypt rounds = **10** (should be ≥12)
2. Field named `password` instead of `passwordHash`
3. No `@Exclude()` — password hash can leak in API responses
4. No `ClassSerializerInterceptor` globally applied

### Files
- `smart-farm-backend/src/entities/user.entity.ts`
- `smart-farm-backend/src/main.ts`

### Step 1: Update User entity

```typescript
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  // ...

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  // ...

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12); // Changed from 10 to 12
    }
  }

  @BeforeUpdate()
  async hashPasswordOnUpdate() {
    if (this.password && !this.password.startsWith('$2b$') && !this.password.startsWith('$2a$')) {
      this.password = await bcrypt.hash(this.password, 12); // Changed from 10 to 12
    }
  }
}
```

### Step 2: Add ClassSerializerInterceptor globally in `main.ts`

```typescript
import { ClassSerializerInterceptor, Reflector } from '@nestjs/common';

// After app creation:
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
```

### Why it matters
Without `@Exclude()` and the serializer, any endpoint returning a User object will include the password hash in the JSON response.

---

## FIX S7 — SQL Injection Audit
**Already secure — skipping.** ✅

All `.query()` calls found are in migration files only (which use static SQL, no user input). No raw parameterized queries with string interpolation found in service files.

---

## FIX S8 — PostgreSQL Index Audit
**Layer:** PostgreSQL / TypeORM | **Severity:** HIGH | **Effort:** 10 min

### Problem
The `User` entity has **no `@Index()` declarations** despite having columns used in WHERE filters (email, role, status).

### Files
- `smart-farm-backend/src/entities/user.entity.ts`

### Changes
```typescript
import { Index } from 'typeorm';

@Entity('users')
export class User {
  // ...

  @Index()
  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Index()
  @Column({ type: 'enum', enum: UserRole, ... })
  role: UserRole;

  @Index()
  @Column({ type: 'enum', enum: UserStatus, ... })
  status: UserStatus;

  // ...
}
```

### Why it matters
Queries filtering by email (login), role (RBAC), or status (admin panels) scan the full table without indexes — causing slowdowns as the user base grows.

---

## FIX S9 — Angular Security Audit
**Layer:** Angular | **Severity:** HIGH | **Effort:** 20 min

### Problem
5 instances of `[innerHTML]=` found in Angular templates — potential XSS vectors.

### Files with `[innerHTML]`
1. `notification-settings.component.html:82` — `[innerHTML]="... | translate:{ ... }"`
2. `notification-settings.component.html:121` — `[innerHTML]="... | translate:{ ... }"`
3. `pending.html:131` — `[innerHTML]="... | translate"`
4. `farmers.component.html:153` — `[innerHTML]="highlightSearch(...)"`
5. `farmers.component.html:155` — `[innerHTML]="highlightSearch(...)"`

### Risk Assessment
- Items 1-3: **LOW RISK** — these use Angular's `translate` pipe which returns static i18n strings. No user input. ✅
- Items 4-5: **MEDIUM RISK** — `highlightSearch()` wraps user search input in `<mark>` tags. If the function doesn't sanitize, an attacker could inject `<script>` tags via the search input.

### Fix for Items 4-5
Verify `highlightSearch()` uses Angular's `DomSanitizer` or HTML-escapes input before wrapping:

```typescript
highlightSearch(text: string): string {
  if (!this.searchTerm) return this.escapeHtml(text);
  const escaped = this.escapeHtml(text);
  const escapedTerm = this.escapeHtml(this.searchTerm);
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  return escaped.replace(regex, '<mark>$1</mark>');
}

private escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}
```

### Angular HTTP Interceptor
Verify the auth interceptor exists and attaches the token. Since we use HttpOnly cookies with `credentials: true`, the interceptor should set `withCredentials: true`:

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const cloned = req.clone({ withCredentials: true });
  return next(cloned);
};
```

### Route Guard Audit
All protected routes already have appropriate guards:
- `canActivate: [authGuard]` — profile, settings ✅
- `canActivate: [farmerGuard]` — all farmer routes ✅
- `canActivate: [authGuard, adminGuard]` — admin routes ✅
- `canActivate: [guestGuard]` — login, register ✅
- `canActivate: [pendingGuard]` — onboarding ✅

---

## FIX S10 — Environment & Secrets Audit
**Layer:** Both | **Severity:** CRITICAL | **Effort:** 15 min

### Problems Found
1. **No `.gitignore`** — everything may be committed to version control
2. **OpenWeatherMap API key hardcoded** in both environment files
3. **No `.env.example`** file for documentation

### Step 1: Create `.gitignore` in project root

```gitignore
# Dependencies
node_modules/
.npm

# Build outputs
dist/
build/
.angular/

# Environment files
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo
.cursor/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test coverage
coverage/

# Temp files
tmp/
temp/
```

### Step 2: Create `.env.example` in backend root

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# JWT (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=<minimum-32-char-random-string>
REFRESH_JWT_SECRET=<different-32-char-random-string>

# Server
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://feedingreen.up.railway.app

# MQTT
MQTT_BROKER=<mqtt-broker-url>
```

### Step 3: Move OpenWeatherMap API key to backend

Remove from `environment.ts` and `environment.prod.ts`:
```typescript
// DELETE THIS:
openWeather: {
  apiKey: 'c2ed6fe22392981b5b18bf25453c8663'
},
```

Create a backend proxy endpoint that calls OpenWeatherMap, keeping the API key server-side only.

### Step 4: Verify Railway environment variables
Ensure these are set in Railway Dashboard:
- `DATABASE_URL` — must include `?sslmode=require`
- `JWT_SECRET` — minimum 32 random characters
- `REFRESH_JWT_SECRET` — different from JWT_SECRET
- `NODE_ENV=production`

---

## FIX S11 — Role-Based Access Control (RBAC)
**Layer:** NestJS | **Severity:** HIGH | **Effort:** 20 min

### Problem
No `@Roles()` decorator or `RolesGuard` found. Admin endpoints rely on frontend-only guards.

### Step 1: Create Roles decorator

File: `smart-farm-backend/src/common/decorators/roles.decorator.ts`
```typescript
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

### Step 2: Create RolesGuard

File: `smart-farm-backend/src/common/guards/roles.guard.ts`
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}
```

### Step 3: Apply to admin controllers

```typescript
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  // All endpoints now require admin role
}
```

---

## SECURITY REPORT TABLE

| Fix | Severity | Status | Files Changed |
|-----|----------|--------|---------------|
| S1 | CRITICAL | ✅ SKIP | — |
| S2 | CRITICAL | 🔧 TODO | app.module.ts, auth.controller.ts |
| S3 | CRITICAL | ✅ SKIP | — |
| S4 | CRITICAL | 🔧 TODO | auth.module.ts, auth.service.ts, auth.controller.ts, jwt.strategy.ts |
| S5 | HIGH | 🔧 TODO | main.ts |
| S6 | CRITICAL | 🔧 TODO | user.entity.ts, main.ts |
| S7 | CRITICAL | ✅ SKIP | — |
| S8 | HIGH | 🔧 TODO | user.entity.ts |
| S9 | HIGH | 🔧 TODO | farmers.component.ts, auth.interceptor.ts |
| S10 | CRITICAL | 🔧 TODO | .gitignore, .env.example, environment files |
| S11 | HIGH | 🔧 TODO | New decorator, guard, admin controllers |

---

> **Phase 3 guide complete. Proceed with implementation.**
