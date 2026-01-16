# Mock Agents Implementation Plan

> Implementation plan for making mock agents fully functional with A2A protocol compliance and A2UI/Generative UI components.

---

## Status: COMPLETED

All agents have been implemented and registered. See implementation details below.

---

## Implementation Summary

| Agent | Category | Status | File Location |
|-------|----------|--------|---------------|
| Crypto Advisor | Finance | **COMPLETED** | `server/src/agents/crypto-advisor.ts` |
| NanoBanana Pro | Creative | **COMPLETED** | `server/src/agents/nanobanana.ts` |
| DocuMind | Productivity | **COMPLETED** | `server/src/agents/documind.ts` |
| Travel Planner | Commerce | **COMPLETED** | `server/src/agents/travel.ts` |
| Restaurant Finder | Commerce | **ENHANCED** | `server/src/agents/restaurant.ts` |

**Removed from scope:** CodePilot, SecureSign (as requested)

---

## API Integration Summary

| Agent | Primary API | Secondary API | LLM API |
|-------|-------------|---------------|---------|
| **Crypto Advisor** | Binance Public API | - | Gemini API |
| **NanoBanana Pro** | Google Gemini Imagen | - | Gemini API |
| **DocuMind** | - | - | Gemini API |
| **Travel Planner** | Amadeus | Google Places | Gemini API |
| **Restaurant Finder** | Google Places | OpenTable | - |

---

## Environment Variables Required

```env
# Core AI (used by most agents)
GEMINI_API_KEY=your_gemini_api_key

# Crypto Advisor
# No API key needed - uses Binance Public API

# NanoBanana Pro
# Uses GEMINI_API_KEY above

# DocuMind
# Uses GEMINI_API_KEY above

# Travel Planner
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Restaurant Finder
GOOGLE_PLACES_API_KEY=your_google_places_api_key
OPENTABLE_CLIENT_ID=your_opentable_client_id       # Optional
OPENTABLE_CLIENT_SECRET=your_opentable_client_secret # Optional
```

---

## Agent Endpoints

All agents are registered in `server/src/index.ts` and accessible at:

| Agent | Base URL | Agent Card |
|-------|----------|------------|
| Restaurant Finder | `/agents/restaurant` | `GET /.well-known/agent.json` |
| RizzCharts | `/agents/rizzcharts` | `GET /.well-known/agent.json` |
| Crypto Advisor | `/agents/crypto-advisor` | `GET /.well-known/agent.json` |
| NanoBanana Pro | `/agents/nanobanana` | `GET /.well-known/agent.json` |
| DocuMind | `/agents/documind` | `GET /.well-known/agent.json` |
| Travel Planner | `/agents/travel` | `GET /.well-known/agent.json` |

Each agent supports:
- `GET /.well-known/agent.json` - Agent card discovery
- `POST /a2a` - JSON-RPC message handler
- `POST /` - JSON-RPC message handler (alternate)

---

## Agent Details

### 1. Crypto Advisor

**File:** `server/src/agents/crypto-advisor.ts`

**Features:**
- Real-time cryptocurrency prices from Binance Public API
- 24h market statistics (high, low, volume, price change)
- AI-powered market analysis using Gemini
- Trading signals with confidence scores
- Individual asset deep-dive analysis
- Top gainers/losers tracking

**A2UI Views:**
- Market Dashboard (price cards, stats)
- Trading Signals List
- Asset Analysis View
- Comparison View

**Intents:**
- "show market" / "market overview"
- "trading signals"
- "analyze BTC" / "analyze ETH"
- "compare BTC ETH"
- "top gainers" / "top losers"

---

### 2. NanoBanana Pro

**File:** `server/src/agents/nanobanana.ts`

**Features:**
- AI image generation using Gemini
- Multiple style presets (photorealistic, digital art, anime, etc.)
- Aspect ratio selection
- Generation history tracking
- Progress updates during generation

**A2UI Views:**
- Generation Form (prompt, style, aspect ratio)
- Progress View
- Results Gallery
- History View

**Intents:**
- "generate {prompt}"
- "create image of {description}"
- "digital art style"
- "show history"

---

### 3. DocuMind

**File:** `server/src/agents/documind.ts`

**Features:**
- Document analysis using Gemini AI
- Automatic summary generation
- Key points extraction
- Entity extraction (people, organizations, dates, amounts)
- Q&A interface for document queries
- Topic identification

**A2UI Views:**
- Upload/Document Selection View
- Summary View
- Q&A Interface
- Entity Extraction View

**Intents:**
- "analyze document" / "upload document"
- "summarize"
- "what are the key points"
- "extract entities"
- "{question about document}"

---

### 4. Travel Planner

**File:** `server/src/agents/travel.ts`

**Features:**
- Flight search via Amadeus API
- Hotel search via Amadeus API
- Attraction discovery via Google Places
- AI-generated itineraries using Gemini
- Budget-aware recommendations
- Interest-based personalization

**A2UI Views:**
- Trip Planning Form
- Flight Search Results
- Hotel Search Results
- AI-Generated Itinerary

**Intents:**
- "plan trip to {destination}"
- "find flights to {destination}"
- "hotels in {destination}"
- "create itinerary"

---

### 5. Restaurant Finder (Enhanced)

**File:** `server/src/agents/restaurant.ts`

**Enhancements:**
- OpenTable API integration for real reservations
- OAuth token management
- Time slot availability
- Enhanced booking form with email/phone
- Fallback to local booking when OpenTable not configured

**A2UI Views:**
- Restaurant List with OpenTable availability badges
- Enhanced Booking Form with timeslots
- Booking Confirmation with confirmation number

**New Capabilities:**
- Real-time availability via OpenTable
- Direct booking through OpenTable API
- Guest information collection for reservations

---

## Registry Updates

The agent registry (`src/services/agents/registry.ts`) has been updated:

### Changes Made:
1. **Updated URLs** - All agents point to local server endpoints
2. **Removed CodePilot** - As requested
3. **Removed SecureSign** - As requested
4. **Renamed ImageGen Pro** - Now "NanoBanana Pro" with Banana icon
5. **Updated providers** - All set to "LiquidCrypto Labs"
6. **Updated authentication** - All set to "none" for local agents

### Current Registry (6 agents):
```typescript
- restaurant-finder  → http://127.0.0.1:3000/agents/restaurant
- crypto-advisor     → http://127.0.0.1:3000/agents/crypto-advisor
- rizzcharts         → http://127.0.0.1:3000/agents/rizzcharts
- documind           → http://127.0.0.1:3000/agents/documind
- nanobanana         → http://127.0.0.1:3000/agents/nanobanana
- travel-planner     → http://127.0.0.1:3000/agents/travel
```

---

## Architecture Reference

### Standard Agent File Structure

```typescript
// server/src/agents/<agent-name>.ts

import type { AgentCard, A2UIMessage, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';

// 1. Data types specific to this agent
interface AgentDataType { ... }

// 2. External API integration (if needed)
async function fetchFromExternalApi(): Promise<...> { ... }

// 3. A2UI generation functions
function generateMainView(data: ...): A2UIMessage[] { ... }
function generateDetailView(data: ...): A2UIMessage[] { ... }
function generateFormView(data: ...): A2UIMessage[] { ... }

// 4. Agent card export
export const get<AgentName>AgentCard = (baseUrl: string): AgentCard => ({ ... });

// 5. Request handler export
export async function handle<AgentName>Request(params: SendMessageParams): Promise<Task> { ... }
```

### Route Registration Pattern

```typescript
// In server/src/index.ts
.group('/agents/<agent-name>', app => {
    const handleRpc = async ({ body, set }: any) => {
        const params = (body as any).params;
        if ((body as any).method === 'agent/card') {
            const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
            return { jsonrpc: '2.0', id: (body as any).id, result: get<AgentName>AgentCard(baseUrl) };
        }
        const result = await handle<AgentName>Request(params);
        return { jsonrpc: '2.0', id: (body as any).id, result };
    };
    return app
        .get('/.well-known/agent.json', () => get<AgentName>AgentCard(baseUrl))
        .post('/a2a', handleRpc)
        .post('/', handleRpc);
})
```

### Supported A2UI Components

| Category | Components |
|----------|------------|
| Layout | `Row`, `Column`, `Card`, `List`, `Tabs`, `Modal` |
| Content | `Text`, `Image`, `Icon`, `Divider` |
| Interactive | `Button`, `TextField`, `Checkbox`, `Slider`, `DateTimeInput`, `MultipleChoice` |
| Media | `Video`, `AudioPlayer` |

---

## Testing

To test each agent:

1. **Start the server:**
   ```bash
   cd server && bun run dev
   ```

2. **Test agent card:**
   ```bash
   curl http://localhost:3000/agents/crypto-advisor/.well-known/agent.json
   ```

3. **Test message handling:**
   ```bash
   curl -X POST http://localhost:3000/agents/crypto-advisor/a2a \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":"1","method":"send_message","params":{"message":{"parts":[{"type":"text","text":"show market"}]}}}'
   ```

---

## Fallback Behavior

All agents are designed with graceful fallbacks:

| Agent | Without API Key |
|-------|-----------------|
| Crypto Advisor | Uses sample market data |
| NanoBanana Pro | Shows sample images, placeholder generation |
| DocuMind | Uses sample document for demo |
| Travel Planner | Shows sample flights/hotels/itineraries |
| Restaurant Finder | Works with Google Places; OpenTable optional |

---

## Future Enhancements

Potential improvements for future iterations:

1. **Crypto Advisor**
   - WebSocket price streaming
   - Portfolio tracking
   - Price alerts

2. **NanoBanana Pro**
   - Image editing/inpainting
   - Image-to-image generation
   - Style transfer

3. **DocuMind**
   - Multi-document comparison
   - OCR for scanned documents
   - Export to various formats

4. **Travel Planner**
   - Car rental integration
   - Activity booking
   - Real-time flight tracking

5. **Restaurant Finder**
   - Waitlist management
   - Review integration
   - Menu preview
