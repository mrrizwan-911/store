export interface WhatsAppOrderParams {
  productName: string
  size?: string
  color?: string
  quantity: number
  price: number
  productUrl: string
}

export function generateWhatsAppOrderUrl(params: WhatsAppOrderParams): string {
  const { productName, size, color, quantity, price, productUrl } = params

  const lines = [
    `Hi! I'd like to order:`,
    ``,
    `Product: ${productName}`,
    size ? `Size: ${size}` : null,
    color ? `Color: ${color}` : null,
    `Quantity: ${quantity}`,
    `Price: PKR ${price.toLocaleString('en-PK')}`,
    ``,
    `Link: ${productUrl}`,
  ]

  const message = lines.filter(Boolean).join('\n')
  const phone = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/[^0-9]/g, '')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export interface CartItemForWhatsApp {
  name: string
  size?: string
  color?: string
  quantity: number
  price: number
}

export function generateWhatsAppCartUrl(
  items: CartItemForWhatsApp[],
  total: number
): string {
  const itemLines = items.map(item => {
    const variant = [item.size, item.color].filter(Boolean).join(', ')
    return `• ${item.name}${variant ? ` (${variant})` : ''} × ${item.quantity} — PKR ${item.price.toLocaleString('en-PK')}`
  })

  const message = [
    `Hi! I'd like to order the following:`,
    ``,
    ...itemLines,
    ``,
    `Total: PKR ${total.toLocaleString('en-PK')}`,
    ``,
    `Please confirm availability and delivery details.`,
  ].join('\n')

  const phone = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/[^0-9]/g, '')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
