import { sendEmail } from './sender'
import { orderConfirmTemplate } from './templates/orderConfirm'
import { orderShippedTemplate } from './templates/orderShipped'
import { orderDeliveredTemplate } from './templates/orderDelivered'

export async function sendOrderConfirmationEmail(order: any, user: any) {
  if (!user?.email) return false

  const html = orderConfirmTemplate(user.name, order.orderNumber, order.items, order.total)

  return sendEmail({
    to: user.email,
    subject: `Order Confirmed — #${order.orderNumber}`,
    html,
    type: 'order_confirmation',
    userId: user.id
  })
}

export async function sendOrderShippedEmail(order: any, user: any, trackingNumber: string) {
  if (!user?.email) return false

  const html = orderShippedTemplate(user.name, order.orderNumber, trackingNumber)

  return sendEmail({
    to: user.email,
    subject: `Your order is on its way! — #${order.orderNumber}`,
    html,
    type: 'order_shipped',
    userId: user.id
  })
}

export async function sendOrderDeliveredEmail(order: any, user: any, pointsEarned: number = 0) {
  if (!user?.email) return false

  const html = orderDeliveredTemplate(user.name, order.orderNumber, pointsEarned)

  return sendEmail({
    to: user.email,
    subject: `Your order has arrived — #${order.orderNumber}`,
    html,
    type: 'order_delivered',
    userId: user.id
  })
}
