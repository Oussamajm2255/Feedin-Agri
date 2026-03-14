# 🔔 FeedinGreen — WebSocket Real-Time Notifications
### Claude Opus 4.6 · Cursor IDE · Plan & Implement Prompt
**Stack:** Angular 20+ · NestJS · PostgreSQL · TypeORM

---

## 📖 How To Use This File

Drag this file into Cursor with your **entire project open**.
Claude Opus 4.6 will read your existing code first, then plan, then implement.
Do NOT skip the audit phase — it prevents conflicts with existing code.

---

---

# PHASE 0 — PROJECT AUDIT (do this before anything else)

```
You are a senior full-stack engineer working on FeedinGreen, an Angular 20+ 
and NestJS application with PostgreSQL and TypeORM, deployed on Railway.

Before writing a single line of code, audit the existing project completely.

## WHAT TO READ

### Backend — read every file in:
  src/
  ├── main.ts
  ├── app.module.ts
  ├── auth/
  ├── users/
  ├── admin/
  └── **/*.gateway.ts   ← any existing WebSocket gateways

### Frontend — read every file in:
  src/app/
  ├── app.routes.ts
  ├── app.module.ts or app.config.ts
  ├── auth/
  ├── admin/
  └── core/             ← interceptors, guards, services

## WHAT TO REPORT

After reading, fill this audit report exactly:

### BACKEND FINDINGS

AUTH SYSTEM:
  [ ] Auth strategy in use: JWT / Session / None
  [ ] JWT expiry: ___
  [ ] User entity location: ___
  [ ] User roles field exists: YES / NO  (values: ___)
  [ ] Login endpoint: ___
  [ ] Register endpoint: ___
  [ ] Access request / activation flow: EXISTS / NOT EXISTS

WEBSOCKET:
  [ ] Any *.gateway.ts found: YES / NO
  [ ] If YES — list file, events it handles, namespace used
  [ ] WebSocket package installed: @nestjs/websockets / socket.io / none

DATABASE:
  [ ] ORM: TypeORM / Prisma / other
  [ ] Existing entities: ___ (list all)
  [ ] Notifications or events table: EXISTS / NOT EXISTS
  [ ] Access request table: EXISTS / NOT EXISTS

MODULES:
  [ ] List every @Module() found and its path

### FRONTEND FINDINGS

ADMIN DASHBOARD:
  [ ] Location: ___
  [ ] Framework/UI library used: ___
  [ ] Current data: static / HTTP polling / reactive (RxJS)
  [ ] Any existing notification UI: YES / NO
  [ ] Socket.io or WebSocket client installed: YES / NO

AUTH:
  [ ] Login component location: ___
  [ ] Token storage: localStorage / HttpOnly cookie / memory
  [ ] Auth guard location: ___
  [ ] Admin route protection: YES / NO

### CONFLICT RISKS

List anything that could conflict with adding WebSocket:
  - Existing gateway that might clash
  - Module imports that need updating
  - CORS config that needs socket allowance
  - Auth guard that needs to cover WS connections

### FINAL VERDICT

State clearly:
  - What already exists that we REUSE
  - What needs to be EXTENDED
  - What needs to be CREATED from scratch

Do NOT write any code yet.
When done, say: "Audit complete. Ready for Phase 1."
```

---

---

# PHASE 1 — ARCHITECTURE PLAN

```
Start Phase 1. Based on the audit, design the full WebSocket architecture.
Do NOT write implementation code yet — plan only.

## WHAT WE ARE BUILDING

A real-time admin notification system with:

  1. ACCESS REQUEST NOTIFICATIONS
     - A user submits a request to access the platform
     - Admin receives an instant WebSocket notification in the dashboard
     - Admin can APPROVE or REJECT directly from the notification
     - Approved → user account activates, user gets notified
     - Rejected → user gets a reason

  2. USER ACTION NOTIFICATIONS
     - Notify admin when users perform key actions
       (uploads, orders, form submissions — based on what exists in the app)
     - Admin sees a live feed of user activity

  3. SYSTEM ALERT NOTIFICATIONS
     - Server errors, failed jobs, unusual activity
     - Displayed as high-priority alerts in the admin dashboard

  4. NOTIFICATION PERSISTENCE
     - All notifications stored in the database
     - Admin can see history, not just live events
     - Mark as read / mark all as read
     - Unread count badge on the dashboard

## PLAN FORMAT

For each section below, describe the design using the EXISTING code as base.
Reference actual file paths from the audit.

### 1. DATABASE SCHEMA PLAN

Design these tables (or confirm they exist):

  AccessRequest:
    - id, userId, status (PENDING/APPROVED/REJECTED), reason, createdAt, reviewedAt, reviewedBy

  Notification:
    - id, type (ACCESS_REQUEST/USER_ACTION/SYSTEM_ALERT), title, message,
      payload (jsonb), isRead, targetAdminId (null = all admins), createdAt

Show the TypeORM @Entity() class design for each.
If any already exist — show how to extend them, not replace them.

### 2. BACKEND ARCHITECTURE PLAN

  NotificationGateway (@WebSocketGateway):
    - Namespace to use: ___
    - How admins authenticate their WS connection (JWT in handshake)
    - Rooms strategy: one room per admin, or broadcast to 'admins' room
    - Events it will EMIT: list them all with payload shape
    - Events it will LISTEN for: list them all

  NotificationService:
    - Methods needed (list each with input/output)
    - How it connects to the gateway to emit events
    - How it persists to the DB

  AccessRequestModule:
    - New endpoints needed (list HTTP method + path + what it does)
    - Which existing module to add these to OR create new module

  Integration points (where to CALL NotificationService):
    - In which existing service methods do we inject NotificationService
    - Exactly which events trigger which notification type

### 3. FRONTEND ARCHITECTURE PLAN

  NotificationService (Angular):
    - Socket.io client connection with JWT auth header
    - Observable streams for each event type
    - Reconnection strategy

  NotificationStore (signal-based or RxJS BehaviorSubject):
    - notifications[]
    - unreadCount
    - isConnected

  NotificationBell Component:
    - Where it goes in the admin layout
    - Badge with unread count
    - Dropdown with notification list

  AccessRequestPanel Component:
    - Where it goes in the admin dashboard
    - Approve / Reject buttons with reason input
    - Real-time list update on new requests

  Toast/Alert Component:
    - For SYSTEM_ALERT type — high visibility
    - Auto-dismiss after 10 seconds

### 4. EVENT FLOW DIAGRAM

Draw the flow as ASCII art for each notification type:

  ACCESS REQUEST:
  User clicks "Request Access"
    → POST /access-requests
    → AccessRequest saved to DB (status: PENDING)
    → NotificationService.create(ACCESS_REQUEST)
    → Notification saved to DB
    → Gateway.emit('notification:new', payload) to 'admins' room
    → Admin dashboard receives event
    → NotificationBell badge increments
    → AccessRequestPanel shows new row
    → Admin clicks Approve
    → PATCH /access-requests/:id/approve
    → AccessRequest status updated
    → User account activated
    → Gateway.emit('access:approved') to that user's socket room
    → User sees success message

  USER ACTION: (draw same flow)
  SYSTEM ALERT: (draw same flow)

### 5. FILE CREATION LIST

List every file that will be CREATED (with full path):
List every file that will be MODIFIED (with full path + what changes):

Do not start implementation.
When done, say: "Phase 1 plan complete. Ready for Phase 2."
```

---

---

# PHASE 2 — BACKEND IMPLEMENTATION

```
Start Phase 2. Implement the backend in this exact order.
Show the complete file content for each — no partial snippets.
After each file, pause and say "✅ [filename] done" before continuing.

## STEP B1 — Install Dependencies

Show the exact npm install command needed.
Check package.json from the audit first — do not reinstall what exists.

Required packages:
  @nestjs/websockets
  @nestjs/platform-socket.io
  socket.io
  @types/socket.io (if needed)

## STEP B2 — Database Entities

Create or extend:

  src/notifications/entities/notification.entity.ts
    @Entity()
    export class Notification {
      @PrimaryGeneratedColumn('uuid') id
      @Column({ type: 'enum', enum: NotificationType }) type
      @Column() title
      @Column() message
      @Column({ type: 'jsonb', nullable: true }) payload
      @Column({ default: false }) isRead
      @Column({ nullable: true }) targetAdminId
      @CreateDateColumn() createdAt
      @ManyToOne(() => User, { nullable: true }) triggeredBy
    }

  src/access-requests/entities/access-request.entity.ts
    @Entity()
    export class AccessRequest {
      @PrimaryGeneratedColumn('uuid') id
      @ManyToOne(() => User) user
      @Column({ type: 'enum', enum: AccessRequestStatus, default: 'PENDING' }) status
      @Column({ nullable: true }) reason
      @CreateDateColumn() createdAt
      @Column({ nullable: true }) reviewedAt
      @Column({ nullable: true }) reviewedById
    }

If these or similar entities already exist from the audit — EXTEND them.

## STEP B3 — Notification Gateway

Create: src/notifications/notifications.gateway.ts

  @WebSocketGateway({
    namespace: '/notifications',
    cors: { origin: process.env.FRONTEND_URL, credentials: true }
  })
  export class NotificationsGateway {
    @WebSocketServer() server: Server;

    // JWT authentication on connection handshake
    // Store admin socket connections in a Map<adminId, socketId>
    // Method: sendToAllAdmins(event, payload)
    // Method: sendToUser(userId, event, payload)
    // Handle: handleConnection, handleDisconnect
    // Implement WsJwtGuard to validate token from handshake.auth.token
  }

## STEP B4 — Notification Service

Create: src/notifications/notifications.service.ts

  Methods to implement:
    create(dto: CreateNotificationDto): Promise<Notification>
      → saves to DB
      → calls gateway.sendToAllAdmins('notification:new', notification)

    findAllForAdmin(adminId, { page, limit, unreadOnly }): Promise<Notification[]>

    markAsRead(id: string, adminId: string): Promise<void>

    markAllAsRead(adminId: string): Promise<void>

    getUnreadCount(adminId: string): Promise<number>

    notifyAccessRequest(request: AccessRequest): Promise<void>
      → calls create() with type ACCESS_REQUEST

    notifyUserAction(userId, action, metadata): Promise<void>
      → calls create() with type USER_ACTION

    notifySystemAlert(title, message, severity): Promise<void>
      → calls create() with type SYSTEM_ALERT

## STEP B5 — Notification Controller

Create: src/notifications/notifications.controller.ts

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Controller('notifications')

  Routes:
    GET    /notifications              → paginated list, unreadOnly query param
    GET    /notifications/unread-count → { count: number }
    PATCH  /notifications/:id/read    → mark one as read
    PATCH  /notifications/read-all    → mark all as read

## STEP B6 — Access Request Module

Create: src/access-requests/access-requests.controller.ts

  Routes:
    POST   /access-requests              → user submits request (auth required)
    GET    /access-requests              → admin gets all requests (admin only)
    PATCH  /access-requests/:id/approve → admin approves (admin only)
      → update status
      → activate user account
      → call notificationService.create for user confirmation
      → gateway.sendToUser(userId, 'access:approved', {})
    PATCH  /access-requests/:id/reject  → admin rejects (admin only)
      → update status, save reason
      → gateway.sendToUser(userId, 'access:rejected', { reason })

## STEP B7 — Wire Up System Alerts

In main.ts or a dedicated interceptor:
  Create a GlobalExceptionFilter that catches unhandled exceptions and calls:
    notificationService.notifySystemAlert(error.name, error.message, 'error')

## STEP B8 — Update app.module.ts

Show the full updated app.module.ts with:
  - NotificationsModule
  - AccessRequestsModule
  - Both properly imported with TypeORM forFeature([...entities])

## STEP B9 — Update main.ts for WebSocket

Show updated main.ts:
  - Socket.io adapter: app.useWebSocketAdapter(new IoAdapter(app))
  - CORS updated to allow socket connections from frontend URL

When all backend steps are done, say:
"✅ Backend complete. Ready for Phase 3 — Frontend."
```

---

---

# PHASE 3 — FRONTEND IMPLEMENTATION

```
Start Phase 3. Implement the Angular frontend in this exact order.
Use Angular 20+ patterns: standalone components, signals, inject().
Show complete file content for each.
After each file, say "✅ [filename] done" before continuing.

## STEP F1 — Install Socket.io Client

  npm install socket.io-client

## STEP F2 — Notification Service

Create: src/app/core/services/notification.service.ts

  @Injectable({ providedIn: 'root' })
  export class NotificationService {
    private socket: Socket;

    // Signals:
    notifications = signal<Notification[]>([]);
    unreadCount   = signal<number>(0);
    isConnected   = signal<boolean>(false);

    connect(token: string): void
      // io('/notifications', { auth: { token }, transports: ['websocket'] })
      // Listen: 'notification:new'  → prepend to notifications(), increment unreadCount
      // Listen: 'access:approved'   → show success toast
      // Listen: 'access:rejected'   → show rejection reason
      // Listen: 'connect'           → isConnected = true
      // Listen: 'disconnect'        → isConnected = false, auto-reconnect after 3s

    disconnect(): void

    // HTTP methods (use existing HttpClient):
    getNotifications(params): Observable<Notification[]>
    markAsRead(id: string): Observable<void>
    markAllAsRead(): Observable<void>
    getUnreadCount(): Observable<number>
  }

## STEP F3 — Access Request Service

Create: src/app/core/services/access-request.service.ts

  Methods:
    submitRequest(): Observable<AccessRequest>
    getRequests(status?): Observable<AccessRequest[]>
    approve(id: string): Observable<void>
    reject(id: string, reason: string): Observable<void>

## STEP F4 — Notification Bell Component

Create: src/app/shared/components/notification-bell/

  notification-bell.component.ts (standalone)
  notification-bell.component.html
  notification-bell.component.scss

  Features:
    - Bell icon with red badge showing unreadCount signal
    - Click opens dropdown panel
    - Dropdown shows last 10 notifications
    - Each notification has: icon by type, title, message, time ago, read/unread state
    - "Mark all as read" button at top
    - "View all" link at bottom
    - Smooth animation on new notification arrival (pulse on bell)
    - Empty state when no notifications

## STEP F5 — Access Request Panel Component

Create: src/app/admin/components/access-request-panel/

  access-request-panel.component.ts (standalone)
  access-request-panel.component.html
  access-request-panel.component.scss

  Features:
    - Table/list of PENDING access requests
    - Each row: user name, email, requested at, action buttons
    - APPROVE button → calls approve(), row updates to green ✓
    - REJECT button → opens inline textarea for reason → confirm → calls reject()
    - Real-time: new requests appear at top automatically via WebSocket
    - Empty state: "No pending requests"
    - Loading skeleton while fetching

## STEP F6 — Toast / Alert Component

Create: src/app/shared/components/toast/

  toast.component.ts (standalone)
  toast.component.html
  toast.component.scss

  Features:
    - Positioned top-right, stacked
    - Types: success (green), warning (orange), error (red), info (blue)
    - SYSTEM_ALERT type → always error/red, stays until dismissed
    - Other types → auto-dismiss after 5 seconds
    - Slide-in animation from right
    - Dismiss button on each toast

  ToastService:
    - show(message, type, duration?)
    - showSystemAlert(title, message)
    - Observable<Toast[]> for the component to render

## STEP F7 — Integrate Into Admin Layout

Find the existing admin layout/shell component from the audit.
Modify it to:

  1. Inject NotificationService and AuthService
  2. On admin login success → call notificationService.connect(token)
  3. On logout → call notificationService.disconnect()
  4. Add <app-notification-bell> to the admin navbar/header
  5. Add <app-access-request-panel> to the admin dashboard page
  6. Add <app-toast> to the root of the admin layout

Show the exact changes to existing files — before and after.

## STEP F8 — Connect After Login

Find the existing login component and auth service.
After successful login, if user role is 'admin':
  notificationService.connect(accessToken)

Show the exact modification — do not rewrite the whole login component,
just show the addition.

## STEP F9 — Access Request Button for Regular Users

Find the existing login page or user-facing page.
Add a "Request Access" button/section:
  - Visible only to users with pending or no access request
  - Calls accessRequestService.submitRequest()
  - Shows status: Pending / Approved / Rejected with reason

When all frontend steps are done, say:
"✅ Frontend complete. Ready for Phase 4 — Testing."
```

---

---

# PHASE 4 — TESTING & VERIFICATION

```
Start Phase 4. Generate a complete test plan and verification checklist.

## MANUAL TEST SCENARIOS

### Test 1 — Access Request Full Flow
  1. Log in as a regular user
  2. Click "Request Access"
  3. WITHOUT refreshing → open admin dashboard in another tab
  4. Expected: notification bell badge increments by 1
  5. Expected: notification appears in dropdown with user's name
  6. Expected: access request panel shows new row
  7. Click APPROVE in admin
  8. Expected: user tab shows "Access Approved" success state
  9. Expected: notification marked as resolved

### Test 2 — Rejection Flow
  1. Submit another access request as user
  2. Admin clicks REJECT → types reason "Missing information"
  3. Expected: user sees rejection with reason message
  4. Expected: admin panel row updates to red/rejected state

### Test 3 — System Alert
  Trigger a deliberate error in NestJS (throw new Error('test'))
  Expected: Admin sees red SYSTEM ALERT toast that does not auto-dismiss
  Expected: Alert appears in notification history

### Test 4 — Reconnection
  1. Disconnect from internet for 5 seconds
  2. Reconnect
  3. Expected: WebSocket auto-reconnects (isConnected signal recovers)
  4. Expected: Any missed notifications load from HTTP fallback

### Test 5 — Multi-Admin
  1. Open admin dashboard in two separate browsers
  2. Submit an access request from a user tab
  3. Expected: BOTH admin dashboards receive the notification simultaneously

### Test 6 — Auth Security on WebSocket
  Try connecting to the WS namespace without a token:
    const socket = io('https://feedingreen.up.railway.app/notifications')
  Expected: Connection refused / 401 error
  Expected: No events received

## CURL VERIFICATION COMMANDS

# Submit access request (as user)
curl -X POST https://feedingreen.up.railway.app/api/access-requests \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json"

# Get all pending requests (as admin)
curl https://feedingreen.up.railway.app/api/access-requests?status=PENDING \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Approve a request
curl -X PATCH https://feedingreen.up.railway.app/api/access-requests/REQUEST_ID/approve \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get notifications
curl https://feedingreen.up.railway.app/api/notifications \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get unread count
curl https://feedingreen.up.railway.app/api/notifications/unread-count \
  -H "Authorization: Bearer ADMIN_TOKEN"

## WEBSOCKET CONNECTION TEST (browser console)

Paste this in browser DevTools while on the admin dashboard:

  const { io } = await import('socket.io-client');
  const socket = io('https://feedingreen.up.railway.app/notifications', {
    auth: { token: localStorage.getItem('access_token') },
    transports: ['websocket']
  });
  socket.on('connect', () => console.log('✅ WS connected:', socket.id));
  socket.on('notification:new', (data) => console.log('🔔 New:', data));
  socket.on('connect_error', (err) => console.error('❌ Error:', err.message));

## COMPLETION CHECKLIST

  [ ] WebSocket connects successfully with valid JWT
  [ ] WebSocket refuses connection without token
  [ ] Access request appears in admin dashboard in real time
  [ ] Approve flow activates user account
  [ ] Reject flow sends reason to user
  [ ] System alerts appear as non-dismissing toasts
  [ ] Notification bell badge shows correct unread count
  [ ] Mark as read works (badge decrements)
  [ ] Mark all as read works
  [ ] Notifications persist in DB (visible after page refresh)
  [ ] Reconnection works after network drop
  [ ] Multiple admins all receive the same notification
  [ ] No memory leaks (disconnect() called on logout)
  [ ] Railway deployment: WS connections work behind Railway proxy

## RAILWAY WEBSOCKET NOTE

Railway supports WebSocket natively.
Ensure in main.ts:
  app.useWebSocketAdapter(new IoAdapter(app));

And in Railway dashboard, no special config needed —
but if connections drop, add to NestJS:
  socket.io options: { pingTimeout: 60000, pingInterval: 25000 }
```

---

---

## 🗺️ Full Event Map

| Event Name | Direction | Trigger | Payload |
|---|---|---|---|
| `notification:new` | Server → Admin | Any notification created | `{ id, type, title, message, payload, createdAt }` |
| `access:approved` | Server → User | Admin approves request | `{ requestId, message }` |
| `access:rejected` | Server → User | Admin rejects request | `{ requestId, reason }` |
| `notification:read` | Server → Admin | Another admin marks read | `{ id }` |
| `system:alert` | Server → All Admins | Server error caught | `{ title, message, severity }` |

---

## 🏗️ Final File Structure

```
backend/src/
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.gateway.ts      ← WebSocket hub
│   ├── notifications.service.ts      ← Business logic + DB
│   ├── notifications.controller.ts   ← HTTP REST endpoints
│   └── entities/
│       └── notification.entity.ts
├── access-requests/
│   ├── access-requests.module.ts
│   ├── access-requests.controller.ts
│   ├── access-requests.service.ts
│   └── entities/
│       └── access-request.entity.ts

frontend/src/app/
├── core/services/
│   ├── notification.service.ts       ← Socket + HTTP
│   └── access-request.service.ts
├── shared/components/
│   ├── notification-bell/
│   └── toast/
└── admin/components/
    └── access-request-panel/
```

---

*FeedinGreen · WebSocket Notification System · Internal Engineering Use Only*
