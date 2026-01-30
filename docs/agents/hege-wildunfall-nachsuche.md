# Hege & Pflege, Wildunfall, Nachsuche Agents

> Three core hunter workflow agents for conservation work, wildlife collisions, and tracking.

---

## Overview

| Agent | Purpose | Tools | Tier |
|-------|---------|-------|------|
| **Hege & Pflege** | Conservation work, Kitzrettung, habitat | 3 | 1-3 |
| **Wildunfall** | Wildlife collision response | 3 | 1-3 |
| **Nachsuche** | Shot follow-up tracking | 3 | 1-2 |

---

## 1. Hege & Pflege Agent

Turns continuous conservation work into a guided, scheduled, and documented workflow.

### Tools

#### `hege.create_project`
Create a Hege & Pflege project (Revierarbeit, Kitzrettung, etc.)

```typescript
{
  project_type: 'revierarbeit' | 'kitzrettung' | 'feeding_round' | 'nest_boxes' | 'habitat' | 'infrastructure',
  title: string,
  date: string, // ISO date
  meeting_point_geo: GeoScope,
  team_scope: 'private' | 'team',
  tasks: Array<{
    label: string,
    task_type?: string,
    assignee?: string,
    geo?: GeoScope,
    due_time?: string
  }>
}
```

**Use Cases:**
- "Revierarbeit Samstag" coordination
- Kitzrettung operations triggered by mowing notices
- Feeding round scheduling

**Tier:** 1 (private), 2 (team notification)

#### `hege.log_activity`
Log a conservation activity (feeding, nest box check, etc.)

```typescript
{
  project_id?: string,
  activity_type: 'feeding' | 'nest_box' | 'habitat' | 'infrastructure' | 'counting' | 'note',
  time: string, // ISO datetime
  geo: GeoScope,
  data: object // activity-specific data
}
```

**Tier:** 1

#### `hege.create_mowing_notice`
Create a mowing notice that triggers Kitzrettung workflow

```typescript
{
  field_name: string,
  geo: GeoScope,
  mowing_start: string, // ISO datetime
  mowing_end?: string,
  contact_name?: string,
  contact_phone?: string,
  notes?: string
}
```

**Use Case:** Farmer notifies of upcoming mowing → Kitzrettung project auto-created

**Tier:** 1 (self), 3 (external dispatch)

### UI Component: `HegeDashboard`

```tsx
import { HegeDashboard } from '@/applications/jagd-agenten/components';

<HegeDashboard />
```

**Features:**
- Projects tab with status tracking
- Activities log
- Create new project form
- Progress indicators per project

---

## 2. Wildunfall Agent

Fast, structured, stress-proof workflow for wildlife-vehicle collisions.

### Tools

#### `wildunfall.start_incident`
Start a wildlife collision incident log

```typescript
{
  time: string, // ISO datetime
  geo: GeoScope,
  suspected_species?: string,
  injury_status?: 'unknown' | 'likely_alive' | 'likely_dead',
  reporter_notes?: string
}
```

**Tier:** 1

#### `wildunfall.dispatch_on_call`
Notify on-call roster for response

```typescript
{
  incident_id: string,
  team_id: string,
  notify_mode: 'in_app' | 'sms' | 'whatsapp_link',
  message?: string
}
```

**Tier:** 2 (in-app), 3 (SMS/WhatsApp)

#### `wildunfall.update_incident`
Update incident status

```typescript
{
  incident_id: string,
  status: 'open' | 'accepted' | 'arrived' | 'resolved' | 'closed',
  geo?: GeoScope,
  data?: object
}
```

**Tier:** 1

### UI Component: `WildunfallMode`

```tsx
import { WildunfallMode } from '@/applications/jagd-agenten/components';

<WildunfallMode />
```

**Features:**
- Big-button emergency UX (stress-proof)
- Quick species selection
- Status progression: Open → Accepted → Arrived → Resolved
- Quick action buttons (Call, Share Location, Alert Team)

---

## 3. Nachsuche Agent

Follow-up tracking after a shot event with clean documentation and role assignment.

### Tools

#### `nachsuche.start_case`
Start a Nachsuche case linked to a hunt session

```typescript
{
  session_id: string,
  shot_event_id: string,
  geo: GeoScope,
  shot_confidence?: number, // 0-100
  flight_direction?: string,
  signs?: Array<'blood' | 'hair' | 'bone' | 'none' | 'unknown'>,
  notes?: string
}
```

**Tier:** 1

#### `nachsuche.assign_team`
Assign roles for the tracking team

```typescript
{
  case_id: string,
  roles: Array<{
    role: 'shooter' | 'handler' | 'dog' | 'driver' | 'safety_contact',
    person?: string
  }>,
  share_scope: 'private' | 'team_coarse'
}
```

**Tier:** 2

#### `nachsuche.update_case`
Update case status and outcome

```typescript
{
  case_id: string,
  status: 'open' | 'started' | 'paused' | 'located' | 'recovered' | 'stopped' | 'closed',
  geo?: GeoScope,
  data?: object // outcome, lessons_learned
}
```

**Tier:** 1

### UI Component: `NachsucheFlow`

```tsx
import { NachsucheFlow } from '@/applications/jagd-agenten/components';

<NachsucheFlow />
```

**Features:**
- Shot confidence slider with wait time recommendation
- Flight direction compass
- Pirschzeichen (signs) selection
- Team role assignment
- Outcome logging (Recovered/Stopped)
- Lessons learned prompt

---

## Database Schema

See: `server/sql/029_hege_wildunfall_nachsuche.sql`

### Tables

| Table | Purpose |
|-------|---------|
| `hege_projects` | Conservation projects |
| `hege_activities` | Activity logs |
| `mowing_notices` | Kitzrettung triggers |
| `wildunfall_incidents` | Collision incidents |
| `wildunfall_oncall_roster` | On-call assignment |
| `wildunfall_dispatch_log` | Dispatch history |
| `nachsuche_cases` | Tracking cases |
| `nachsuche_team` | Team assignments |
| `nachsuche_tracks` | Track segments (optional) |

### Views

- `hege_weekly_summary` — Activity counts by week
- `wildunfall_response_metrics` — Response times by month
- `nachsuche_outcomes` — Case outcomes by hunter

---

## Permission Model

| Action | Tier | Confirmation |
|--------|------|--------------|
| Log Hege activity | 1 | No |
| Create team project | 2 | Yes (notifies) |
| Send mowing notice dispatch | 3 | Yes (external) |
| Start Wildunfall log | 1 | No |
| Dispatch on-call roster (in-app) | 2 | Yes |
| Dispatch on-call roster (SMS) | 3 | Yes |
| Start Nachsuche case | 1 | No |
| Assign Nachsuche team | 2 | Yes |

---

## Privacy Guardrails

⚠️ **Hard Rules:**

1. **Wildunfall incidents** — Private/team only, never public
2. **Nachsuche locations** — Never public, team share is explicit opt-in, coarse grid only
3. **Mowing notices** — Contact info redacted from any shared view
4. **Block any public post** containing:
   - Precise locations for Wildunfall/Nachsuche
   - "Live chase" information
   - Road identifiers (auto-redact if too specific)

---

## Chat UI Patterns

Extend available chips: `Plan | Do | Explain | Assign | Notify | Log`

### Example: Mowing Notice → Kitzrettung

```
User: "Der Bauer mäht morgen Feld Nord"
