# API Documentation

## Base URLs

- **Backend**: `http://localhost:3010`
- **Frontend**: `http://localhost:5180`

## Authentication Endpoints

### POST /api/icloud/login

Initiate iCloud login.

**Request:**
```json
{
  "appleId": "user@example.com",
  "password": "password123"
}
```

**Response (Success - needs 2FA):**
```json
{
  "success": true,
  "requires2FA": true,
  "message": "2FA code required"
}
```

**Response (Success - no 2FA):**
```json
{
  "success": true,
  "requires2FA": false,
  "accountInfo": {
    "dsid": "12345678",
    "fullName": "John Doe",
    "appleId": "user@example.com"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

### POST /api/icloud/2fa

Submit 2FA verification code.

**Request:**
```json
{
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "accountInfo": {
    "dsid": "12345678",
    "fullName": "John Doe",
    "appleId": "user@example.com"
  }
}
```

---

### GET /api/icloud/session

Check current session status.

**Response (Authenticated):**
```json
{
  "authenticated": true,
  "accountInfo": {
    "dsid": "12345678",
    "fullName": "John Doe",
    "appleId": "user@example.com"
  }
}
```

**Response (Not authenticated):**
```json
{
  "authenticated": false
}
```

---

### POST /api/icloud/logout

End current session.

**Response:**
```json
{
  "success": true
}
```

---

## iCloud Service Endpoints

All service endpoints require an authenticated session (cookie).

### GET /api/icloud/mail

Fetch emails from inbox.

**Query Parameters:**
- `folder` (optional): Mail folder (default: "INBOX")
- `limit` (optional): Max messages (default: 50)

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg-123",
      "from": "sender@example.com",
      "to": ["recipient@example.com"],
      "subject": "Hello World",
      "date": "2024-01-15T10:30:00Z",
      "body": "Message content...",
      "read": true,
      "hasAttachments": false
    }
  ]
}
```

---

### GET /api/icloud/calendar

Fetch calendar events.

**Query Parameters:**
- `from` (optional): Start date (ISO 8601)
- `to` (optional): End date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "event-123",
      "title": "Meeting",
      "startDate": "2024-01-15T14:00:00Z",
      "endDate": "2024-01-15T15:00:00Z",
      "location": "Conference Room A",
      "notes": "Discuss project timeline",
      "allDay": false
    }
  ]
}
```

---

### GET /api/icloud/contacts

Fetch contacts.

**Response:**
```json
{
  "success": true,
  "contacts": [
    {
      "id": "contact-123",
      "firstName": "John",
      "lastName": "Doe",
      "emails": ["john@example.com"],
      "phones": ["+1234567890"],
      "company": "Acme Inc"
    }
  ]
}
```

---

### GET /api/icloud/drive

Fetch iCloud Drive contents.

**Query Parameters:**
- `path` (optional): Folder path (default: "/")

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "id": "item-123",
      "name": "Documents",
      "type": "folder",
      "path": "/Documents",
      "modifiedDate": "2024-01-10T08:00:00Z"
    },
    {
      "id": "item-456",
      "name": "report.pdf",
      "type": "file",
      "path": "/Documents/report.pdf",
      "size": 1024000,
      "modifiedDate": "2024-01-12T16:30:00Z"
    }
  ]
}
```

---

### GET /api/icloud/notes

Fetch notes.

**Response:**
```json
{
  "success": true,
  "notes": [
    {
      "id": "note-123",
      "title": "Shopping List",
      "content": "- Milk\n- Eggs\n- Bread",
      "folder": "Notes",
      "createdDate": "2024-01-05T12:00:00Z",
      "modifiedDate": "2024-01-14T09:15:00Z"
    }
  ]
}
```

---

### GET /api/icloud/reminders

Fetch reminders.

**Response:**
```json
{
  "success": true,
  "reminders": [
    {
      "id": "reminder-123",
      "title": "Call dentist",
      "notes": "Schedule cleaning",
      "dueDate": "2024-01-20T10:00:00Z",
      "completed": false,
      "priority": 1,
      "list": "Personal"
    }
  ]
}
```

---

### GET /api/icloud/photos

Fetch photos metadata.

**Query Parameters:**
- `limit` (optional): Max photos (default: 100)
- `album` (optional): Album name

**Response:**
```json
{
  "success": true,
  "photos": [
    {
      "id": "photo-123",
      "filename": "IMG_1234.jpg",
      "width": 4032,
      "height": 3024,
      "createdDate": "2024-01-10T15:30:00Z",
      "thumbnailUrl": "/api/icloud/photos/photo-123/thumb"
    }
  ]
}
```

---

### GET /api/icloud/findmy

Fetch Find My devices.

**Response:**
```json
{
  "success": true,
  "devices": [
    {
      "id": "device-123",
      "name": "John's iPhone",
      "deviceType": "iPhone",
      "batteryLevel": 0.85,
      "location": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "accuracy": 10,
        "timestamp": "2024-01-15T12:00:00Z"
      },
      "isOnline": true
    }
  ]
}
```

---

## AI Endpoints

### POST /api/ai/chat

Send a message to the Claude AI agent.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Show me my upcoming calendar events"
    }
  ],
  "sessionId": "session-123"
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "role": "assistant",
    "content": "I found 3 upcoming events...",
    "toolCalls": [
      {
        "id": "call-123",
        "name": "get_calendar_events",
        "input": { "days": 7 },
        "result": { "events": [...] }
      }
    ]
  }
}
```

---

## Error Responses

All endpoints may return error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `UNAUTHORIZED` - No valid session
- `INVALID_INPUT` - Bad request parameters
- `SERVICE_ERROR` - iCloud service error
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting

- Authentication endpoints: 5 requests/minute
- Service endpoints: 60 requests/minute
- AI endpoints: 20 requests/minute

---

## CORS

The backend accepts requests from:
- `http://localhost:5180` (development)
- Configured `FRONTEND_URL` environment variable
