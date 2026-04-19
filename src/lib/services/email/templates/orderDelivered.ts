export function orderDeliveredTemplate(name: string, orderNumber: string, pointsEarned: number): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourstore.com'

  const pointsText = pointsEarned > 0
    ? `<p style="color:#E8D5B0;font-size:16px;margin:0 0 24px;text-align:center;">You earned <strong>${pointsEarned} loyalty points</strong> with this purchase!</p>`
    : ''

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="520" style="background:#141414;border:1px solid #222;max-width:520px;width:100%;">
        <tr><td style="padding:32px;">
          <h2 style="color:#E8D5B0;font-size:22px;margin:0 0 8px;">Your order has arrived</h2>
          <p style="color:#888;font-size:14px;margin:0 0 24px;">Hi ${name}, your order #${orderNumber} has been delivered successfully. We hope you love your new items!</p>

          ${pointsText}

          <div style="text-align:center;margin:32px 0;">
            <a href="${appUrl}/account"
               style="background:#E8D5B0;color:#0A0A0A;padding:14px 32px;text-decoration:none;font-weight:600;display:inline-block;">
              Write a Review
            </a>
            <span style="display:inline-block;width:16px;"></span>
            <a href="${appUrl}/"
               style="background:transparent;border:1px solid #E8D5B0;color:#E8D5B0;padding:13px 31px;text-decoration:none;font-weight:600;display:inline-block;">
              Shop Again
            </a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()
}