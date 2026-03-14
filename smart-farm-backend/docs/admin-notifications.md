# Admin Notifications System Architecture

## 1. Overview
The Admin Notifications System serves as the **Intelligence Center** for platform administrators and moderators. It centralizes system health alerts, performance degradation warnings, user activity insights, and automation auditing into a single real-time dashboard.

Unlike regular user notifications (which focus on specific farm alerts), **admin notifications** are platform-wide alerts designed to ensure overall system reliability, security, and smooth operations.

## 2. Notification Model

### 2.1 Severities
Each notification is categorized by its urgency:
* 🔴 **Critical**: Immediate action required (e.g., database failure, MQTT disconnection). These are automatically pinned to the top of the feed until resolved.
* 🟠 **Warning**: Attention needed to prevent failure (e.g., mass device offline spike, delayed sensor readings).
* 🔵 **Info**: General platform activity and auditing (e.g., new registrations, manual overrides).
* 🟢 **Success**: System recoveries or positive milestones (e.g., scheduled maintenance completion, platform growth summaries).

### 2.2 Domains
Notifications are grouped by the platform area they affect:
* **`system`**: Core infrastructure (database, MQTT broker, APIs).
* **`farms`**: Creation, assignments, or platform-wide farm metrics.
* **`devices`**: Hardware health (offline spikes, unresponsive hubs).
* **`crops`**: Broad crop-related issues or orphan entities.
* **`users`**: Registrations, inactivity, or subscription statuses.
* **`automation`**: Failing rules, high-frequency oscillations, manual overrides.

### 2.3 Status Workflow
Notifications follow a specific lifecycle:
1. **`new`**: Newly triggered alert.
2. **`acknowledged`**: An admin has seen the alert and is actively investigating (records who acknowledged and when).
3. **`resolved`**: The underlying issue is fixed. Critical alerts are unpinned once resolved.

## 3. Trigger Events (When Admins Get Notified)

The `AdminAlertingService` listens to system-wide events and generates notifications with built-in deduplication (to prevent alert flood during cascading failures).

### 🚨 Infrastructure & System Events
| Event trigger | Condition / Cause | Severity |
| :--- | :--- | :--- |
| `mqtt.disconnected` | Connection to MQTT broker lost | Critical |
| `mqtt.reconnected` | Connection to MQTT broker restored | Success |
| `database.unhealthy` | Database connection pool exhausted or queries failing | Critical |
| `health.degraded` | Specific microservice experiencing latency/errors | Warning |
| `platform.weekly_summary` | Scheduled cron job generating platform statistics | Success |

### 📟 Hardware & Device Health
| Event trigger | Condition / Cause | Severity |
| :--- | :--- | :--- |
| `device.offline_spike` | Abnormal number of devices disconnect simultaneously | Warning |
| `sensor.reading_delay` | Sensor fails to report data within expected interval | Warning |
| `farm.orphan_entities` | Devices registered without sensors, or vice versa | Info |

### 🧑‍🌾 User Management & Subscriptions
| Event trigger | Condition / Cause | Severity |
| :--- | :--- | :--- |
| `user.registered` | A new user signs up on the platform | Info |
| `user.farm_request` | A user requests access to a specific farm | Info |
| `user.inactive` | User hasn't logged in for >30 days | Info |
| `user.subscription_expired`| A premium farm subscription lapses | Warning |
| `farm.created` | A new farm instance is initialized | Info |

### ⚙️ Automation & Execution Auditing
| Event trigger | Condition / Cause | Severity |
| :--- | :--- | :--- |
| `action.execution_failed` | System failed to execute command on physical actuator | Warning |
| `action.high_frequency` | Device receives excessive commands (oscillation loop) | Warning |
| `automation.manual_override`| User manually triggers action overriding an active rule | Info |
| `automation.disabled` | User completely disables an automation rule | Info |

## 4. Administrator Capabilities

From the UI dashboard, administrators can perform the following actions:

### Filtering and Triage
* **Filter by Severity**: Quickly view only critical or warning alerts.
* **Filter by Domain**: Isolate issues strictly related to `devices` or `users`.
* **Date Range & Search**: Find specific alerts based on keywords, context, or timeframes.

### Alert Management
* **Acknowledge**: Mark an alert as 'Acknowledged' to signal to other admins that the issue is being investigated.
* **Resolve**: Mark an alert as 'Resolved' once the underlying issue is fixed. This also unpins critical alerts.
* **Bulk Actions**: Acknowledge or resolve multiple selected notifications simultaneously.

### Insight & Remediation
* **View Contextual Detail**: Click into an alert to view raw JSON payload data (device IDs, error stack traces, specific query durations).
* **Suggested Actions**: Follow dynamically generated recommendations (e.g., "Check MQTT logs," "Contact farm operator," "Increase hysteresis threshold").
* **Navigate to Entities**: Direct deep-links to specific user profiles, device details pages, or farm overviews related to the alert.
* **Export Audit Logs**: Download a JSON export of notification history for secondary analysis or record-keeping.

## 5. Technical Implementation Details
* **Real-time Delivery**: New alerts are pushed to active admin sessions via WebSockets (`AdminNotificationsGateway`).
* **Deduplication**: The alerting service maintains a sliding window (default 5 minutes) to prevent identical duplicate alerts from flooding the database.
* **Database Cleanup**: A scheduled job automatically purges `resolved` notifications older than 90 days to maintain database performance.
