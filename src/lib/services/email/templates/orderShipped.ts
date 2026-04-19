export function orderShippedTemplate(name: string, orderNumber: string, trackingNumber: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourstore.com'

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="520" style="background:#141414;border:1px solid #222;max-width:520px;width:100%;">
        <tr><td style="padding:32px;">
          <h2 style="color:#E8D5B0;font-size:22px;margin:0 0 8px;">Your order is on its way!</h2>
          <p style="color:#888;font-size:14px;margin:0 0 24px;">Hi ${name}, your order #${orderNumber} has been shipped.</p>

          <div style="background:#0A0A0A;border:1px solid #222;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="color:#F5F5F5;font-size:14px;margin:0 0 8px;">Tracking Number</p>
            <p style="color:#E8D5B0;font-size:18px;font-weight:bold;margin:0;">${trackingNumber}</p>
          </div>

          <div style="text-align:center;margin:32px 0;">
            <a href="${appUrl}/account"
               style="background:#E8D5B0;color:#0A0A0A;padding:14px 32px;text-decoration:none;font-weight:600;display:inline-block;">
              Track your order
            </a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()
}