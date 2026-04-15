# DAY 08 — Quotation System + PDF Generation

## Overview

**Goal:** A B2B bulk order quotation system — customers submit a quote request form, an AI-drafted email body is generated, and a branded PDF quotation is emailed back. Admin can view, edit, approve, and convert quotations to orders.

**Deliverables:**
- `POST /api/quotations` — create quotation + AI draft
- `GET /api/quotations/[id]` — fetch single quotation (admin or owner)
- `PATCH /api/quotations/[id]` — update quotation status, send email
- `GET /api/admin/quotations` — list all quotations (admin)
- `POST /api/quotations/[id]/send-pdf` — generate PDF + send email
- `src/lib/services/pdf/quotation.ts` — PDF generation with jsPDF
- `src/lib/services/email/quotation.ts` — quotation email sender
- `/quotation` page — public request form
- `/admin/quotations` — admin inbox
- `/admin/quotations/[id]` — admin detail view + actions

**Success Criteria:**
- Quotation form submits and creates record in DB
- AI draft is generated immediately (< 3 seconds)
- PDF contains customer info, items table, total, company branding
- Admin can update status and send the PDF via email
- Converting quotation to order creates a real Order record
- Quotations expire after 7 days (stored in expiresAt, enforced in status display)

---

## Prerequisites

- Day 1: Quotation model in schema
- Day 2: Auth system (admin check)
- Day 7: Anthropic client for AI draft

---

## Setup & Script Tasks

```bash
# PDF generation library
npm install jspdf jspdf-autotable
npm install -D @types/jspdf

# Also install html-to-pdf alternative (optional — jsPDF is lighter)
# Alternative: npm install puppeteer (heavier but better HTML rendering)

# Create directories
mkdir -p src/app/api/admin/quotations
mkdir -p "src/app/api/quotations/[id]/send-pdf"
mkdir -p src/lib/services/pdf
mkdir -p src/lib/services/email/templates
mkdir -p "src/app/(store)/quotation"
mkdir -p "src/app/(admin)/admin/quotations/[id]"
```

---

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/lib/services/pdf/quotation.ts` | CREATE | PDF generator function |
| `src/lib/services/email/quotation.ts` | CREATE | Send quotation email |
| `src/lib/services/email/templates/quotation.ts` | CREATE | Quotation HTML email template |
| `src/lib/validations/quotation.ts` | CREATE | Zod schema for quotation form |
| `src/app/api/quotations/route.ts` | CREATE | POST — create quotation |
| `src/app/api/quotations/[id]/route.ts` | CREATE | GET — fetch quotation |
| `src/app/api/quotations/[id]/send-pdf/route.ts` | CREATE | POST — generate + email PDF |
| `src/app/api/admin/quotations/route.ts` | CREATE | GET — admin list all |
| `src/app/api/admin/quotations/[id]/route.ts` | CREATE | PATCH — update status |
| `src/app/(store)/quotation/page.tsx` | CREATE | Public quotation form page |
| `src/components/store/QuotationForm.tsx` | CREATE | Dynamic repeatable form |
| `src/app/(admin)/admin/quotations/page.tsx` | CREATE | Admin quotation inbox |
| `src/app/(admin)/admin/quotations/[id]/page.tsx` | CREATE | Admin quotation detail |
| `src/components/admin/QuotationDetail.tsx` | CREATE | Admin detail component |

---

## Specifications

### Quotation Data Model (review from Day 1)

```
Quotation {
  id, userId?, name, email, phone?, company?,
  items: Json  // [{ productId, qty, notes }]
  status: QuotationStatus  // PENDING | SENT | ACCEPTED | REJECTED | CONVERTED | EXPIRED
  pdfUrl: String?          // Cloudinary URL after PDF is generated
  aiDraft: String?         // AI-generated email body
  expiresAt: DateTime?     // 7 days from creation
}
```

---

### `POST /api/quotations`

**Auth:** Optional (guests can request quotations)

**Request body (validated by Zod):**
```json
{
  "name": "Tariq Industries",
  "email": "procurement@tariq.pk",
  "phone": "+92-21-1234567",
  "company": "Tariq Industries Ltd",
  "items": [
    { "productId": "prod_abc", "quantity": 50, "notes": "White color only, delivery by Eid" },
    { "productId": "prod_def", "quantity": 25, "notes": "Mixed sizes M and L" }
  ]
}
```

**Validation rules:**
- `name`: min 2 chars
- `email`: valid email
- `items`: array, min 1 item, each with `productId` (string) + `quantity` (int, min 1)
- `notes`: optional per item, max 500 chars

**Processing:**
1. Validate input
2. Fetch product names for the AI context
3. Call Claude to generate AI email draft
4. Create Quotation record in DB with `status: PENDING`, `expiresAt: now + 7 days`
5. Return quotation ID

**AI draft prompt:**
```
Write a professional quotation acknowledgment email body for a Pakistani B2B customer.

Customer: {name}, Company: {company or "Individual"}
Number of product lines: {items.length}
Total quantity: {total_qty} units

Requirements:
- Formal but warm Pakistani business tone
- Reference that we will review their requirements and respond within 24 hours
- Mention that a formal PDF quotation will follow
- Under 150 words
- No pricing (pricing goes in the PDF)
- Do not include a subject line or salutation — just the body paragraphs
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quotationId": "...",
    "message": "Your quotation request has been received. We'll respond within 24 hours."
  }
}
```

---

### `src/lib/services/pdf/quotation.ts`

**Function:** `generateQuotationPDF(quotation: QuotationWithProducts): Buffer`

**PDF structure:**
1. Header: Company logo placeholder (left) + "QUOTATION" heading (right, gold)
2. Metadata row: Quotation #, Date, Expiry Date, Status
3. Customer section: Name, Email, Phone, Company
4. Items table (jsPDF-autotable):
   - Columns: #, Product Name, Quantity, Unit Price (PKR), Total (PKR)
   - Subtotal + any discount row + Grand Total
5. Footer: "Valid for 7 days" + contact info
6. Watermark: "DRAFT" in light gray if status is PENDING

**Branding:** Use brand colors from SCREENS.md — gold (`#E8D5B0`) headers, dark (`#0A0A0A`) background for header row.

**Note:** For Day 8, use placeholder prices (products may not have been quoted yet — admin fills in real prices before sending). The PDF is generated with placeholder prices and admin edits before sending.

**Returns:** `Buffer` (can be sent as email attachment or uploaded to Cloudinary)

---

### `POST /api/quotations/[id]/send-pdf`

**Auth:** Required, ADMIN role

**Processing:**
1. Fetch quotation with products
2. Generate PDF using `generateQuotationPDF`
3. Upload PDF to Cloudinary (or attach directly to email)
4. Send email to customer using `sendQuotationEmail`
5. Update `Quotation.status = SENT`, `pdfUrl = cloudinary_url`
6. Return 200

---

### Admin Quotation Detail Page

**Left panel:**
- Customer info card: name, email, phone, company
- Items table: product name, quantity, notes per item
- "Convert to Order" button (gold) — creates real Order from quotation

**Center panel:**
- AI draft text (editable textarea with "Regenerate" button)
- Status dropdown + "Update Status" button
- Expiry date + "Extend 7 days" button

**Right panel:**
- PDF preview iframe (when `pdfUrl` exists)
- "Generate PDF" button (first time)
- "Download PDF" button
- "Send Quotation Email" button

---

### Quotation Form (Customer Side `/quotation`)

**Layout:** Two-column (form left, info panel right)

**Left — Form:**
- Section: Contact Info (Name, Email, Phone, Company optional)
- Section: Products — dynamic rows:
  - Product input (searchable select — uses product API)
  - Quantity input (number, min 10 for wholesale)
  - Notes textarea (optional)
  - Red X to remove row
  - "+ Add Another Product" button
- Special requirements textarea
- Submit button: "Submit Quote Request" (gold, full width)
- Success state: checkmark + "Request received! Check your email."

**Right — Info Panel:**
- Why request a quote?
  - Volume discounts available
  - Minimum order: 10 units per style
  - Response within 24 hours
  - Custom packaging available
- WhatsApp direct link for urgent queries

---

## Full Code Templates

### `src/lib/validations/quotation.ts`

```typescript
import { z } from 'zod'

export const quotationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product is required'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        notes: z.string().max(500).optional(),
      })
    )
    .min(1, 'At least one product is required'),
  specialRequirements: z.string().max(2000).optional(),
})

export type QuotationInput = z.infer<typeof quotationSchema>
```

### `src/app/api/quotations/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { quotationSchema } from '@/lib/validations/quotation'
import { anthropic, AI_MODEL } from '@/lib/services/ai/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = quotationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, phone, company, items } = parsed.data

    // Fetch product names for AI context
    const productIds = items.map(i => i.productId)
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    })
    const productMap = Object.fromEntries(products.map(p => [p.id, p.name]))

    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)

    // AI-drafted acknowledgment body
    const aiResponse = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `Write a professional quotation acknowledgment email body for a Pakistani B2B customer.

Customer: ${name}, Company: ${company ?? 'Individual'}
Number of product lines: ${items.length}
Total quantity: ${totalQty} units

Requirements:
- Formal but warm Pakistani business tone (can use "Respected Sir/Madam" style)
- Reference that we will review their requirements and respond within 24 hours
- Mention that a formal PDF quotation will follow
- Under 150 words
- No pricing — just acknowledgment
- Do not include subject line or salutation — body paragraphs only`,
        },
      ],
    })

    const aiDraft =
      aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''

    const quotation = await db.quotation.create({
      data: {
        name,
        email,
        phone,
        company,
        items,
        aiDraft,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          quotationId: quotation.id,
          message: 'Your quotation request has been received. We will respond within 24 hours.',
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[QUOTATION_CREATE]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
```

### `src/lib/services/pdf/quotation.ts`

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface QuotationItem {
  productName: string
  quantity: number
  unitPrice: number
  notes?: string
}

interface QuotationData {
  quotationNumber: string
  createdAt: Date
  expiresAt: Date | null
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  company?: string | null
  items: QuotationItem[]
  totalAmount: number
}

export function generateQuotationPDF(data: QuotationData): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Header background
  doc.setFillColor(10, 10, 10)  // #0A0A0A
  doc.rect(0, 0, 210, 40, 'F')

  // Company name
  doc.setFontSize(20)
  doc.setTextColor(232, 213, 176)  // #E8D5B0
  doc.setFont('helvetica', 'bold')
  doc.text('STORE', 15, 20)

  // "QUOTATION" label
  doc.setFontSize(12)
  doc.setTextColor(232, 213, 176)
  doc.text('QUOTATION', 150, 15)

  doc.setFontSize(9)
  doc.setTextColor(136, 136, 136)  // #888888
  doc.text(`#${data.quotationNumber}`, 150, 20)
  doc.text(`Date: ${data.createdAt.toLocaleDateString('en-PK')}`, 150, 25)
  if (data.expiresAt) {
    doc.text(`Valid until: ${data.expiresAt.toLocaleDateString('en-PK')}`, 150, 30)
  }

  // Customer info
  doc.setFontSize(10)
  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', 15, 55)
  doc.setFont('helvetica', 'normal')
  doc.text(data.customerName, 15, 62)
  if (data.company) doc.text(data.company, 15, 67)
  doc.text(data.customerEmail, 15, data.company ? 72 : 67)
  if (data.customerPhone) doc.text(data.customerPhone, 15, data.company ? 77 : 72)

  // Items table
  autoTable(doc, {
    startY: 90,
    head: [['#', 'Product', 'Qty', 'Unit Price (PKR)', 'Total (PKR)']],
    body: data.items.map((item, idx) => [
      idx + 1,
      item.productName + (item.notes ? `\n${item.notes}` : ''),
      item.quantity,
      item.unitPrice.toLocaleString('en-PK'),
      (item.quantity * item.unitPrice).toLocaleString('en-PK'),
    ]),
    foot: [['', '', '', 'GRAND TOTAL', data.totalAmount.toLocaleString('en-PK')]],
    headStyles: { fillColor: [10, 10, 10], textColor: [232, 213, 176] },
    footStyles: { fillColor: [232, 213, 176], textColor: [10, 10, 10], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 9 },
  })

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setTextColor(136, 136, 136)
  doc.text('This quotation is valid for 7 days from the date of issue.', 15, pageHeight - 15)
  doc.text('Contact: orders@yourstore.com | WhatsApp: +92-XXX-XXXXXXX', 15, pageHeight - 10)

  return Buffer.from(doc.output('arraybuffer'))
}
```

### `src/lib/services/email/quotation.ts`

```typescript
import { Resend } from 'resend'
import { db } from '@/lib/db/client'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendQuotationEmail(
  email: string,
  name: string,
  aiDraft: string,
  pdfBuffer: Buffer,
  quotationNumber: string
): Promise<void> {
  await resend.emails.send({
    from: 'quotations@yourstore.com',
    to: email,
    subject: `Your Quotation #${quotationNumber} from Store`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0A0A0A; padding: 24px; color: #E8D5B0;">
          <h2 style="margin: 0; font-size: 20px;">STORE — Quotation</h2>
        </div>
        <div style="padding: 24px; background: #fff; color: #0A0A0A;">
          <p>Dear ${name},</p>
          ${aiDraft.split('\n').map(p => `<p>${p}</p>`).join('')}
          <p style="color: #888;">Quotation #${quotationNumber} is attached to this email.</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `quotation-${quotationNumber}.pdf`,
        content: pdfBuffer.toString('base64'),
      },
    ],
  })

  await db.emailLog.create({
    data: { email, type: 'quotation_sent', status: 'sent' },
  })
}
```

---

## Tests Required

### `tests/integration/quotation.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { db } from '@/lib/db/client'

// Mock Anthropic to avoid real API calls in integration tests
vi.mock('@/lib/services/ai/client', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Thank you for your quotation request. We will respond within 24 hours.' }],
      }),
    },
  },
  AI_MODEL: 'claude-opus-4-6',
}))

describe('Quotation system', () => {
  let quotationId: string
  let productId: string

  beforeAll(async () => {
    const category = await db.category.findFirst()
    const product = await db.product.create({
      data: {
        name: 'Test Quotation Product',
        slug: `test-quot-${Date.now()}`,
        description: 'Test',
        basePrice: 2500,
        sku: `TQP-${Date.now()}`,
        categoryId: category!.id,
      },
    })
    productId = product.id
  })

  it('creates a quotation with AI draft', async () => {
    const quotation = await db.quotation.create({
      data: {
        name: 'Test Corp',
        email: 'test@testcorp.com',
        company: 'Test Corp Ltd',
        items: [{ productId, quantity: 50, notes: 'White color' }],
        aiDraft: 'Thank you for your quotation request.',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
    quotationId = quotation.id

    expect(quotation.status).toBe('PENDING')
    expect(quotation.aiDraft).toBeTruthy()
    expect(quotation.expiresAt).toBeTruthy()
  })

  it('quotation expires after 7 days', async () => {
    const quotation = await db.quotation.findUnique({ where: { id: quotationId } })
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    const diff = quotation!.expiresAt!.getTime() - quotation!.createdAt.getTime()
    expect(diff).toBeGreaterThanOrEqual(sevenDays - 1000) // within 1 second
  })

  afterAll(async () => {
    await db.quotation.deleteMany({ where: { id: quotationId } })
    await db.product.delete({ where: { id: productId } })
  })
})
```

---

## Acceptance Criteria

- [ ] `POST /api/quotations` creates record + AI draft within 3 seconds
- [ ] AI draft is stored in `Quotation.aiDraft` field
- [ ] `expiresAt` is 7 days from creation
- [ ] Admin `GET /api/admin/quotations` returns all quotations with customer info
- [ ] `PATCH /api/admin/quotations/[id]` with `status: "SENT"` updates status
- [ ] PDF generation produces valid PDF (non-zero file size, correct sections)
- [ ] Quotation email sends with PDF attached
- [ ] "Convert to Order" creates Order record linked to quotation customer
- [ ] Form shows success state after submission (no redirect — replace form with confirmation)
- [ ] Admin can edit the AI draft before sending
- [ ] All integration tests pass

---

## Progress Tracker Updates

```
[2026-04-22] Email quotation system with AI-drafted body — done
[2026-04-22] Auto-generated branded PDF quotation — done
[2026-04-22] Quotation inbox (view, edit, approve, resend) — done
[2026-04-22] B2B Bulk Order Portal (RFQ form → quotation system) — done
```
