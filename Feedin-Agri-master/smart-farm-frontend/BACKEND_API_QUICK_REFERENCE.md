# 🚀 Backend API Quick Reference Guide

## Complete list of required endpoints for Admin Dashboard integration

---

## 📊 **1. Dashboard Overview APIs**

### GET `/api/admin/dashboard/stats`
**Purpose**: Get system-wide statistics for dashboard cards

**Response:**
```json
{
  "totalDevices": 1247,
  "totalDevicesChange": "+12.5%",
  "activeUsers": 342,
  "activeUsersChange": "+8.2%",
  "systemHealth": 98.5,
  "systemHealthChange": "+0.3%",
  "totalFarms": 89,
  "totalFarmsChange": "+5",
  "activeFarmers": 156,
  "activeFarmersChange": "+12",
  "systemAlerts": 23,
  "systemAlertsChange": "-5"
}
```

### GET `/api/admin/dashboard/activities?limit=10`
**Purpose**: Get recent system activities for activity feed

**Response:**
```json
{
  "activities": [
    {
      "id": "act_123",
      "type": "success",
      "icon": "add_circle",
      "title": "New device registered",
      "description": "Soil Sensor #SEN-8234 added to Farm Delta",
      "timestamp": "2025-11-24T14:30:00Z",
      "deviceId": "dev_8234",
      "farmId": "farm_delta"
    }
  ]
}
```

### GET `/api/admin/dashboard/system-status`
**Purpose**: Get real-time system health status

**Response:**
```json
{
  "apiServer": {
    "status": "online",
    "uptime": 864000,
    "responseTime": 45
  },
  "database": {
    "status": "online",
    "connections": 25,
    "queryLatency": 12
  },
  "mqttBroker": {
    "status": "online",
    "connectedDevices": 342
  },
  "storage": {
    "totalGB": 500,
    "usedGB": 390,
    "percentUsed": 78
  }
}
```

---

## 🔌 **2. Devices Management APIs**

### GET `/api/admin/devices?page=1&limit=50&status=online&search=sensor`
**Purpose**: List all devices with pagination and filters

**Response:**
```json
{
  "devices": [
    {
      "device_id": "dev_123",
      "device_name": "Soil Sensor Alpha",
      "device_type": "sensor",
      "farm_id": "farm_001",
      "farm_name": "Green Valley Farm",
      "status": "online",
      "battery_level": 85,
      "last_seen": "2025-11-24T14:30:00Z",
      "location": { "lat": 40.7128, "lng": -74.0060 },
      "firmware_version": "v2.1.0",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-11-24T14:30:00Z"
    }
  ],
  "total": 1247,
  "page": 1,
  "limit": 50,
  "totalPages": 25
}
```

### GET `/api/admin/devices/:id`
**Purpose**: Get single device details

### POST `/api/admin/devices`
**Purpose**: Create new device

**Request Body:**
```json
{
  "device_name": "New Sensor",
  "device_type": "sensor",
  "farm_id": "farm_001",
  "location": { "lat": 40.7128, "lng": -74.0060 }
}
```

### PUT `/api/admin/devices/:id`
**Purpose**: Update device configuration

### DELETE `/api/admin/devices/:id`
**Purpose**: Delete device

### GET `/api/admin/devices/stats`
**Purpose**: Get device statistics

**Response:**
```json
{
  "total": 1247,
  "online": 1150,
  "offline": 85,
  "maintenance": 12,
  "byType": {
    "sensor": 850,
    "actuator": 320,
    "gateway": 77
  }
}
```

---

## 💚 **3. System Health APIs**

### GET `/api/admin/system/health`
**Purpose**: Overall system health status

**Response:**
```json
{
  "status": "healthy",
  "uptime": 864000,
  "cpu": { "usage": 45.5, "cores": 8 },
  "memory": { "total": 16384, "used": 8192, "free": 8192 },
  "disk": { "total": 500, "used": 390, "free": 110 },
  "services": {
    "api": { "status": "online", "responseTime": 45 },
    "database": { "status": "online", "connections": 25 },
    "mqtt": { "status": "online", "connectedDevices": 342 }
  }
}
```

### GET `/api/admin/system/metrics?period=1h&interval=5m`
**Purpose**: Performance metrics over time

### GET `/api/admin/system/uptime`
**Purpose**: System uptime statistics

---

## 📝 **4. Logs APIs**

### GET `/api/admin/logs?level=error&module=devices&limit=50&page=1`
**Purpose**: System logs with filtering

**Response:**
```json
{
  "logs": [
    {
      "id": "log_123",
      "timestamp": "2025-11-24T14:30:00Z",
      "level": "error",
      "module": "devices",
      "message": "Device connection timeout",
      "userId": "user_456",
      "metadata": {
        "deviceId": "dev_789",
        "error": "TIMEOUT_ERROR"
      }
    }
  ],
  "total": 523,
  "page": 1,
  "limit": 50
}
```

### GET `/api/admin/audit-logs?userId=&action=&limit=100`
**Purpose**: User action audit trail

---

## 👥 **5. Users Management APIs**

### GET `/api/admin/users?role=farmer&status=active&page=1&limit=50`
**Purpose**: List all users

**Response:**
```json
{
  "users": [
    {
      "user_id": "user_123",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "farmer",
      "status": "active",
      "last_login": "2025-11-24T14:00:00Z",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 342,
  "page": 1,
  "limit": 50
}
```

### POST `/api/admin/users`
**Purpose**: Create new user

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "password": "secure_password",
  "role": "farmer"
}
```

### PUT `/api/admin/users/:id`
**Purpose**: Update user details/role

### DELETE `/api/admin/users/:id`
**Purpose**: Delete user account

---

## 🌾 **6. Farms Management APIs**

### GET `/api/admin/farms?page=1&limit=50`
**Purpose**: List all farms

**Response:**
```json
{
  "farms": [
    {
      "farm_id": "farm_001",
      "farm_name": "Green Valley Farm",
      "owner_id": "user_123",
      "owner_name": "John Doe",
      "location": { "lat": 40.7128, "lng": -74.0060 },
      "area_hectares": 50.5,
      "device_count": 25,
      "status": "active",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 89,
  "page": 1,
  "limit": 50
}
```

### POST `/api/admin/farms`
**Purpose**: Create new farm

### PUT `/api/admin/farms/:id`
**Purpose**: Update farm details

### DELETE `/api/admin/farms/:id`
**Purpose**: Delete farm

---

## 👨‍🌾 **7. Farmers Management APIs**

### GET `/api/admin/farmers?page=1&limit=50`
**Purpose**: List all farmers

**Response:**
```json
{
  "farmers": [
    {
      "user_id": "user_123",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "assigned_farms": [
        {
          "farm_id": "farm_001",
          "farm_name": "Green Valley Farm",
          "area_hectares": 50.5
        }
      ],
      "total_devices": 25,
      "last_active": "2025-11-24T14:00:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 50
}
```

### GET `/api/admin/farmers/:id/farms`
**Purpose**: Get farmer's assigned farms

### POST `/api/admin/farmers/:id/assign-farm`
**Purpose**: Assign farm to farmer

**Request Body:**
```json
{
  "farm_id": "farm_002"
}
```

---

## ⚙️ **8. Settings APIs**

### GET `/api/admin/settings`
**Purpose**: Get all system settings

**Response:**
```json
{
  "general": {
    "site_name": "TerraFlow Smart Farm",
    "contact_email": "admin@terraflow.com",
    "maintenance_mode": false
  },
  "notifications": {
    "email_enabled": true,
    "sms_enabled": false
  },
  "security": {
    "session_timeout": 3600,
    "max_login_attempts": 5
  }
}
```

### PUT `/api/admin/settings`
**Purpose**: Update system settings

**Request Body:**
```json
{
  "general": {
    "maintenance_mode": true
  }
}
```

---

## 🔐 **Authentication**

All admin endpoints require:
1. **Authentication**: Valid JWT token in cookie/header
2. **Authorization**: User role must be `admin`

**Example Header:**
```
Authorization: Bearer <jwt_token>
Cookie: session=<session_cookie>
```

**Error Responses:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Admin access required",
    "statusCode": 403
  }
}
```

---

## 📋 **Common Query Parameters**

All list endpoints support:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `search`: Search query
- `sort`: Sort field
- `order`: Sort order (asc/desc)
- `status`: Filter by status
- `role`: Filter by role

**Example:**
```
GET /api/admin/devices?page=2&limit=25&search=sensor&status=online&sort=created_at&order=desc
```

---

## 🎯 **Implementation Priority**

### Phase 1: Dashboard Overview
1. `/api/admin/dashboard/stats`
2. `/api/admin/dashboard/activities`
3. `/api/admin/dashboard/system-status`

### Phase 2: Core Management
4. `/api/admin/devices` (all CRUD operations)
5. `/api/admin/users` (all CRUD operations)
6. `/api/admin/farms` (all CRUD operations)

### Phase 3: Monitoring
7. `/api/admin/system/health`
8. `/api/admin/logs`
9. `/api/admin/audit-logs`

### Phase 4: Advanced Features
10. `/api/admin/farmers` (assignments)
11. `/api/admin/settings`
12. `/api/admin/system/metrics`

---

## 💡 **Tips for Implementation**

1. **Use DTOs**: Create TypeScript interfaces matching the response structures
2. **Add Pagination**: All list endpoints should support pagination
3. **Add Filtering**: Add query parameters for common filters
4. **Add Sorting**: Allow sorting by key fields
5. **Error Handling**: Return consistent error responses
6. **Validation**: Validate all input data
7. **Logging**: Log all admin actions for audit trail
8. **Rate Limiting**: Protect endpoints from abuse
9. **Caching**: Cache frequently accessed data
10. **Documentation**: Use Swagger/OpenAPI for API docs

---

**Ready to implement? Start with Phase 1 endpoints!** 🚀































