# DAY 07 — AI Features (Chatbot + Size Recommender + Visual Search)

## Overview

**Goal:** Three AI-powered features using the Anthropic Claude API — a shopping assistant chatbot, a smart size recommender based on body measurements, and an AI product description generator for the admin panel. All use streaming where appropriate for fast UX.

**Deliverables:**
- `POST /api/ai/chat` — shopping assistant (Claude claude-opus-4-6, streaming)
- `POST /api/ai/size-recommend` — size recommendation given height/weight/category
- `POST /api/ai/generate-description` — admin tool: AI product description
- `POST /api/ai/sentiment` — analyze review sentiment (batch, not streaming)
- `ChatWidget` client component — floating chat bubble
- `SizeRecommenderModal` — input form + AI response
- AI product description button in admin product form
- Rate limiting on all AI endpoints (expensive!)

**Success Criteria:**
- Chat responds within 3 seconds for simple queries
- Streaming response displays word-by-word (no full-page wait)
- Size recommender returns a specific size recommendation in < 5 seconds
- AI description generator produces 150-200 word product description
- AI endpoints rate-limited to 10 requests/minute per IP
- Model used is `claude-opus-4-6` throughout

---

## Prerequisites

- Day 1: `ANTHROPIC_API_KEY` in env, `@anthropic-ai/sdk` installed
- Day 4: Product data accessible from DB for chatbot context
- Day 13: Rate limiting middleware (pre-build simplified version today)

---

## Setup & Script Tasks

```bash
# Verify Anthropic SDK installed
node -e "require('@anthropic-ai/sdk'); console.log('Anthropic SDK OK')"

# Create AI API directories
mkdir -p src/app/api/ai/{chat,size-recommend,generate-description,sentiment}
mkdir -p src/lib/services/ai
mkdir -p src/components/store  # already exists

# Install streaming response utility (built into Next.js — no extra install needed)
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/lib/services/ai/client.ts` | CREATE | Shared Anthropic client instance |
| `src/lib/services/ai/sizeRecommender.ts` | CREATE | Size recommendation function |
| `src/lib/services/ai/sentimentAnalyzer.ts` | CREATE | Review sentiment analysis |
| `src/app/api/ai/chat/route.ts` | CREATE | Streaming chat endpoint |
| `src/app/api/ai/size-recommend/route.ts` | CREATE | Size recommendation endpoint |
| `src/app/api/ai/generate-description/route.ts` | CREATE | Product description generator |
| `src/app/api/ai/sentiment/route.ts` | CREATE | Review sentiment batch analysis |
| `src/components/store/ChatWidget.tsx` | CREATE | Floating chat bubble + dialog |
| `src/components/store/SizeRecommenderModal.tsx` | CREATE | Size input modal |
| `src/lib/utils/rateLimit.ts` | CREATE | Simple in-memory rate limiter (Upstash on Day 13) |

---

## Specifications

### `src/lib/services/ai/client.ts`

**Purpose:** Single Anthropic client instance, initialized once.

```typescript
import Anthropic from '@anthropic-ai/sdk'

// Singleton — initialized at module level, safe in Node.js server context
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const AI_MODEL = 'claude-opus-4-6' as const
```

---

### `POST /api/ai/chat` — Shopping Assistant

**Auth:** Optional (logged-in users get personalized context)

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "I need a formal shirt for a wedding" }
  ],
  "userId": "user_xxx"  // optional
}
```

**Processing:**
1. Rate limit by IP (10 req/min for AI endpoints)
2. Fetch up to 50 featured/active products for context (ordered by `isFeatured: desc`)
3. Format as product context string for system prompt
4. Call Claude with streaming enabled
5. Return as streaming `ReadableStream` (Server-Sent Events format)

**System prompt:**
```
You are a helpful shopping assistant for a Pakistani fashion store selling Clothes, Shoes, Apparel, and Accessories.

You help customers find the perfect outfit based on occasion, budget, and personal style.

Available products:
{productContext}

Rules:
- Recommend specific products by exact name
- Mention prices in Pakistani Rupees (PKR)
- Ask about occasion, budget, and body measurements when relevant
- Keep responses concise (under 150 words unless the customer asks for more)
- Be warm and conversational — this is a luxury fashion brand
- Never recommend products not in the list above
```

**Streaming response format:** Use Next.js `ReadableStream` with `text/event-stream` content type.

**Client-side:** Display streamed tokens character by character as they arrive. Show typing indicator while waiting for first token.

---

### `POST /api/ai/size-recommend`

**Auth:** Not required

**Request:**
```json
{
  "height": 175,      // cm
  "weight": 70,       // kg
  "category": "shirt",  // "shirt" | "pants" | "shoes" | "kurta" | "shalwar"
  "gender": "male"    // "male" | "female" | "unisex"
}
```

**Validation:**
- height: 100-250 cm
- weight: 30-300 kg
- category: enum of supported types
- gender: enum

**Prompt:**
```
For a {gender} customer who is {height}cm tall and weighs {weight}kg:

What size {category} should they order from a Pakistani clothing brand?

Pakistani sizing context:
- Shirts/Kurtas: XS (36"), S (38"), M (40"), L (42"), XL (44"), XXL (46")
- Trousers: sizes 28-40 (waist in inches)
- Shoes: UK sizing 5-12

Respond with ONLY:
1. Recommended size: [size]
2. One sentence explanation mentioning the key measurement used.
3. Optional: one alternative size if between sizes.

Keep total response under 50 words.
```

**Response:** `{ success: true, data: { recommendation: "...", rawResponse: "..." } }`

---

### `POST /api/ai/generate-description` (Admin Tool)

**Auth:** Required, ADMIN role only

**Request:**
```json
{
  "productName": "Linen Dress Shirt",
  "category": "Shirts",
  "tags": ["formal", "cotton", "summer"],
  "basePrice": 4500,
  "variants": ["White - M", "Navy - L", "Sky Blue - XL"]
}
```

**Prompt:**
```
Write a product description for an online fashion store selling to Pakistani customers.

Product: {productName}
Category: {category}
Tags: {tags}
Price: PKR {basePrice}
Available in: {variants}

Requirements:
- 150-180 words
- First sentence is a compelling hook
- Mention fabric/material quality
- Mention occasion suitability
- Mention care instructions
- End with a call to action
- Tone: confident, aspirational, luxury fashion brand
- No generic phrases like "perfect for any occasion"
- Include at least one Pakistan-specific cultural reference if appropriate
```

**Response:** `{ success: true, data: { description: "..." } }`

---

### `POST /api/ai/sentiment` — Review Sentiment Analysis

**Auth:** Required, ADMIN role

**Request:**
```json
{
  "reviews": [
    { "id": "rev_1", "body": "Amazing quality, true to size!" },
    { "id": "rev_2", "body": "Disappointed, color was different from photo" }
  ]
}
```

**Processing:** Single API call with all reviews (batched prompt, not one-per-review).

**Prompt:**
```
Analyze the sentiment of each customer review below. For each review, classify as: positive, negative, or neutral.

Reviews:
{reviewList}

Respond in JSON format only:
[
  { "id": "rev_1", "sentiment": "positive" },
  { "id": "rev_2", "sentiment": "negative" }
]
```

**Response:** Parsed JSON array. Update `Review.sentiment` field in DB for each review ID.

---

### `ChatWidget` Component Specification

**Behavior:**
- Floating bubble: bottom-right, 56px circle, gold background, chat icon
- On click: opens a dialog/sheet with chat interface
- Chat window: 400px wide, 500px tall (mobile: full screen)
- Messages: user messages right-aligned (gold bg), AI messages left-aligned (surface bg)
- Input: text field + send button at bottom
- Streaming: each new token appends to the last AI message in real time
- Clear button at top of chat window

**State management:** Local component state (not Redux — chat is ephemeral)

**Context displayed:** "Ask me anything about our collection"

---

### `SizeRecommenderModal` Component Specification

**Trigger:** "Size Guide" link on PDP page and on Size Guide tab

**Content:**
- Tab 1: "Size Chart" — static table (S/M/L/XL with measurements)
- Tab 2: "AI Size Finder" — form + result

**AI Size Finder form:**
- Height input (cm) with unit toggle (cm/ft)
- Weight input (kg) with unit toggle (kg/lbs)
- Category: auto-populated from current product category
- Gender: radio buttons (Male / Female)
- "Find My Size" button (gold)

**Result display:**
- Bold size recommendation (e.g., "Size L")
- One-sentence explanation
- "Add this size to cart" button

---

## Full Code Templates

### `src/app/api/ai/chat/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { anthropic, AI_MODEL } from '@/lib/services/ai/client'
import { db } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Fetch product context for the assistant
    const products = await db.product.findMany({
      where: { isActive: true },
      select: {
        name: true,
        basePrice: true,
        salePrice: true,
        category: { select: { name: true } },
        variants: { select: { size: true, color: true }, take: 3 },
      },
      take: 50,
      orderBy: { isFeatured: 'desc' },
    })

    const productContext = products
      .map(p => {
        const price = p.salePrice ? `PKR ${p.salePrice} (sale)` : `PKR ${p.basePrice}`
        return `${p.name} — ${p.category.name} — ${price}`
      })
      .join('\n')

    const stream = await anthropic.messages.stream({
      model: AI_MODEL,
      max_tokens: 1024,
      system: `You are a helpful shopping assistant for a Pakistani fashion store.
You help customers find clothes, shoes, apparel, and accessories.

Available products:
${productContext}

Always recommend specific products by name. Keep responses concise and friendly.
Prices are in Pakistani Rupees (PKR). If asked about sizing, ask for height and weight.`,
      messages,
    })

    // Return SSE stream
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('[AI_CHAT]', err)
    return Response.json({ success: false, error: 'AI service unavailable' }, { status: 503 })
  }
}
```

### `src/lib/services/ai/sizeRecommender.ts`

```typescript
import { anthropic, AI_MODEL } from './client'

interface SizeInput {
  height: number   // cm
  weight: number   // kg
  category: string // 'shirt' | 'pants' | 'shoes' | 'kurta'
  gender: 'male' | 'female' | 'unisex'
}

export async function recommendSize(input: SizeInput): Promise<string> {
  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: `For a ${input.gender} customer who is ${input.height}cm tall and weighs ${input.weight}kg:

What size ${input.category} should they order from a Pakistani clothing brand?

Pakistani sizing context:
- Shirts/Kurtas: XS (36"), S (38"), M (40"), L (42"), XL (44"), XXL (46")
- Trousers: sizes 28-40 (waist in inches)  
- Shoes: UK sizing 5-12

Respond with ONLY:
1. Recommended size: [size]
2. One sentence explanation.

Keep total response under 50 words.`,
      },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text : 'Unable to recommend'
}
```

### `src/app/api/ai/size-recommend/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { recommendSize } from '@/lib/services/ai/sizeRecommender'

const sizeRequestSchema = z.object({
  height: z.number().min(100).max(250),
  weight: z.number().min(30).max(300),
  category: z.enum(['shirt', 'pants', 'shoes', 'kurta', 'shalwar', 'jacket']),
  gender: z.enum(['male', 'female', 'unisex']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = sizeRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const recommendation = await recommendSize(parsed.data)

    return NextResponse.json({ success: true, data: { recommendation } })
  } catch (err) {
    console.error('[AI_SIZE]', err)
    return NextResponse.json({ success: false, error: 'AI service unavailable' }, { status: 503 })
  }
}
```

### `src/app/api/ai/generate-description/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { anthropic, AI_MODEL } from '@/lib/services/ai/client'
import { z } from 'zod'

const descriptionRequestSchema = z.object({
  productName: z.string().min(2),
  category: z.string(),
  tags: z.array(z.string()),
  basePrice: z.number(),
  variants: z.array(z.string()),
})

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const payload = verifyAccessToken(token)
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = descriptionRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  const { productName, category, tags, basePrice, variants } = parsed.data

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `Write a product description for an online fashion store selling to Pakistani customers.

Product: ${productName}
Category: ${category}
Tags: ${tags.join(', ')}
Price: PKR ${basePrice.toLocaleString()}
Available in: ${variants.join(', ')}

Requirements:
- 150-180 words
- First sentence is a compelling hook
- Mention fabric/material quality implied by the product name
- Mention occasion suitability
- Tone: confident, aspirational, luxury fashion
- No clichés like "perfect for any occasion"
- End with a subtle call to action`,
      },
    ],
  })

  const description = response.content[0].type === 'text' ? response.content[0].text : ''

  return NextResponse.json({ success: true, data: { description } })
}
```

---

## Tests Required

### `tests/unit/sizeRecommender.test.ts`

Mock the Anthropic client to test the function structure without API calls:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/services/ai/client', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Recommended size: L\nFor your height and weight, L provides the best fit.' }],
      }),
    },
  },
  AI_MODEL: 'claude-opus-4-6',
}))

import { recommendSize } from '@/lib/services/ai/sizeRecommender'

describe('Size recommender', () => {
  it('returns a string recommendation', async () => {
    const result = await recommendSize({
      height: 175,
      weight: 70,
      category: 'shirt',
      gender: 'male',
    })
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('calls Anthropic API with correct model', async () => {
    const { anthropic } = await import('@/lib/services/ai/client')
    await recommendSize({ height: 160, weight: 55, category: 'pants', gender: 'female' })
    expect(anthropic.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-opus-4-6' })
    )
  })
})
```

```bash
npx vitest run tests/unit/sizeRecommender.test.ts
```

---

## Acceptance Criteria

- [ ] `POST /api/ai/chat` streams response — tokens appear progressively in browser
- [ ] Chat response references real products from database
- [ ] `POST /api/ai/size-recommend` returns specific size in < 5 seconds
- [ ] Size recommendation includes both a size and an explanation
- [ ] Admin-only: `POST /api/ai/generate-description` returns ~150 word description
- [ ] Non-admin calling generate-description → 403
- [ ] `POST /api/ai/sentiment` updates `Review.sentiment` in database
- [ ] ChatWidget opens on click, closes on backdrop click or X
- [ ] Streaming messages display word-by-word (no flash of full text)
- [ ] SizeRecommenderModal works from PDP Size Guide link
- [ ] Model is `claude-opus-4-6` in all AI calls (check logs)
- [ ] All unit tests pass (with mocks)

---

## Progress Tracker Updates

```
[2026-04-21] AI shopping assistant chatbot (GPT-4o / Claude API) — done
[2026-04-21] Smart size recommender (height/weight input) — done
[2026-04-21] AI product description generator (admin tool) — done
[2026-04-21] Sentiment analysis on reviews — done
```
