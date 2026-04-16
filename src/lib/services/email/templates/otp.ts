export function otpEmailTemplate(name: string, code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#FAFAFA;border:1px solid #E5E5E5;max-width:480px;width:100%;">
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#000000;font-size:24px;margin:0 0 8px;font-weight:600;">
                Verify Your Email
              </h1>
              <p style="color:#737373;font-size:14px;margin:0 0 32px;">
                Hi ${name}, enter this code to verify your account.
              </p>
              <div style="background:#FFFFFF;border:1px solid #E5E5E5;padding:24px;text-align:center;margin:0 0 24px;">
                <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#000000;font-family:monospace;">
                  ${code}
                </span>
              </div>
              <p style="color:#737373;font-size:12px;margin:0;">
                This code expires in <strong style="color:#000000;">10 minutes</strong>.<br/>
                If you didn't create an account, ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
