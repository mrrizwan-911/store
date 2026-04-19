interface CartItem {
  product: { name: string; basePrice: any; slug: string; images: { url: string }[] }
  quantity: number
}

export function abandonedCartTemplate(name: string, items: CartItem[]): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourstore.com'

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #222;">
        <img src="${item.product.images[0]?.url ?? ''}"
             style="width:60px;height:75px;object-fit:cover;display:inline-block;vertical-align:middle;" />
        <span style="margin-left:12px;color:#F5F5F5;font-size:14px;">${item.product.name} x ${item.quantity}</span>
      </td>
      <td style="padding:12px;border-bottom:1px solid #222;color:#E8D5B0;text-align:right;">
        PKR ${Number(item.product.basePrice).toLocaleString('en-PK')}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="520" style="background:#141414;border:1px solid #222;max-width:520px;width:100%;">
        <tr><td style="padding:32px;">
          <h2 style="color:#E8D5B0;font-size:22px;margin:0 0 8px;">You left something behind</h2>
          <p style="color:#888;font-size:14px;margin:0 0 24px;">Hi ${name}, your cart is waiting for you.</p>

          <table width="100%" style="border-collapse:collapse;">
            ${itemRows}
          </table>

          <div style="text-align:center;margin:32px 0;">
            <a href="${appUrl}/cart"
               style="background:#E8D5B0;color:#0A0A0A;padding:14px 32px;text-decoration:none;font-weight:600;display:inline-block;">
              Complete Your Purchase
            </a>
          </div>

          <p style="color:#888;font-size:12px;text-align:center;">
            Items in your cart are not reserved and may sell out.<br/>
            <a href="${appUrl}/unsubscribe" style="color:#888;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()
}