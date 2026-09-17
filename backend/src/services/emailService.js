const https = require("https");

/*
|--------------------------------------------------------------------------
| Email Service
|--------------------------------------------------------------------------
|
| Production requirement:
| Render Free compatible HTTPS email API.
|
| We intentionally DO NOT use SMTP/Nodemailer SMTP here because
| this backend may run on Render Free.
|
| Current provider: Resend
|
*/

/*
|--------------------------------------------------------------------------
| Environment Configuration
|--------------------------------------------------------------------------
*/

const RESEND_API_URL = "https://api.resend.com/emails";

const getResendApiKey = () => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured in environment variables."
    );
  }

  return apiKey;
};

const getEmailFrom = () => {
  const fromEmail = process.env.EMAIL_FROM;

  if (!fromEmail) {
    throw new Error(
      "EMAIL_FROM is not configured in environment variables."
    );
  }

  return fromEmail;
};

/*
|--------------------------------------------------------------------------
| HTTPS Request Helper
|--------------------------------------------------------------------------
|
| Uses Node's native HTTPS module.
| No SMTP connection is involved.
|
*/

const sendResendRequest = (payload) => {
  return new Promise((resolve, reject) => {
    const apiKey = getResendApiKey();

    const requestData = JSON.stringify(payload);

    const url = new URL(RESEND_API_URL);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",

      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestData),
      },

      timeout: 15000,
    };

    const request = https.request(
      options,
      (response) => {
        let responseBody = "";

        response.on("data", (chunk) => {
          responseBody += chunk;
        });

        response.on("end", () => {
          let parsedBody = {};

          try {
            parsedBody = responseBody
              ? JSON.parse(responseBody)
              : {};
          } catch {
            parsedBody = {
              raw: responseBody,
            };
          }

          if (
            response.statusCode >= 200 &&
            response.statusCode < 300
          ) {
            resolve(parsedBody);
            return;
          }

          const error = new Error(
            parsedBody?.message ||
              "Email provider rejected the request."
          );

          error.code =
            parsedBody?.name ||
            "EMAIL_PROVIDER_ERROR";

          error.statusCode =
            response.statusCode;

          error.providerResponse =
            parsedBody;

          reject(error);
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(
        new Error(
          "Email provider request timed out."
        )
      );
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.write(requestData);
    request.end();
  });
};

/*
|--------------------------------------------------------------------------
| Send Email
|--------------------------------------------------------------------------
*/

const sendEmail = async ({
  to,
  subject,
  html,
  text,
}) => {
  if (!to) {
    throw new Error(
      "Recipient email address is required."
    );
  }

  if (!subject) {
    throw new Error(
      "Email subject is required."
    );
  }

  if (!html && !text) {
    throw new Error(
      "Email must contain HTML or plain-text content."
    );
  }

  const payload = {
    from: getEmailFrom(),
    to: [to],
    subject,
  };

  if (html) {
    payload.html = html;
  }

  if (text) {
    payload.text = text;
  }

  return sendResendRequest(payload);
};

/*
|--------------------------------------------------------------------------
| Send Password Reset OTP Email
|--------------------------------------------------------------------------
*/

const sendPasswordResetOtpEmail = async ({
  to,
  name,
  otp,
  expiryMinutes = 10,
}) => {
  if (!to) {
    throw new Error(
      "Admin email address is required."
    );
  }

  if (!otp) {
    throw new Error(
      "Password reset OTP is required."
    );
  }

  const safeName =
    name?.trim() || "Admin";

  const subject =
    "Your Portfolio Admin Password Reset OTP";

  const text = [
    `Hello ${safeName},`,
    "",
    "We received a request to reset your Personal Career Portfolio admin password.",
    "",
    `Your OTP is: ${otp}`,
    "",
    `This OTP will expire in ${expiryMinutes} minutes.`,
    "",
    "If you did not request a password reset, you can safely ignore this email.",
    "",
    "For security reasons, never share this OTP with anyone.",
    "",
    "Personal Career Portfolio",
  ].join("\n");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Password Reset OTP</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background: #f5f2ee;
          font-family: Arial, Helvetica, sans-serif;
          color: #24211f;
        "
      >
        <div
          style="
            width: 100%;
            padding: 40px 16px;
            box-sizing: border-box;
          "
        >
          <div
            style="
              max-width: 560px;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #e8e1db;
              border-radius: 18px;
              overflow: hidden;
            "
          >
            <div
              style="
                padding: 28px 30px;
                border-bottom: 1px solid #eee7e1;
              "
            >
              <div
                style="
                  font-size: 13px;
                  font-weight: 700;
                  letter-spacing: 0.08em;
                  text-transform: uppercase;
                  color: #a85d49;
                "
              >
                Personal Career Portfolio
              </div>

              <h1
                style="
                  margin: 12px 0 0;
                  font-size: 25px;
                  line-height: 1.3;
                  color: #201c19;
                "
              >
                🔐 Password Reset
              </h1>
            </div>

            <div
              style="
                padding: 30px;
              "
            >
              <p
                style="
                  margin: 0 0 16px;
                  font-size: 16px;
                  line-height: 1.7;
                "
              >
                Hello ${safeName},
              </p>

              <p
                style="
                  margin: 0 0 22px;
                  font-size: 15px;
                  line-height: 1.7;
                  color: #625b55;
                "
              >
                We received a request to reset your
                Portfolio Admin password.
              </p>

              <div
                style="
                  margin: 24px 0;
                  padding: 22px;
                  text-align: center;
                  background: #faf7f3;
                  border: 1px solid #eadfd6;
                  border-radius: 14px;
                "
              >
                <div
                  style="
                    margin-bottom: 9px;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: #8b8179;
                  "
                >
                  Your OTP
                </div>

                <div
                  style="
                    font-size: 34px;
                    line-height: 1;
                    font-weight: 800;
                    letter-spacing: 0.18em;
                    color: #a85d49;
                  "
                >
                  ${otp}
                </div>
              </div>

              <p
                style="
                  margin: 0 0 12px;
                  font-size: 14px;
                  line-height: 1.7;
                  color: #625b55;
                "
              >
                  ⏳ This OTP will expire in
                  <strong>${expiryMinutes} minutes</strong>.
              </p>

              <p
                style="
                  margin: 0 0 12px;
                  font-size: 14px;
                  line-height: 1.7;
                  color: #625b55;
                "
              >
                🔒 Never share this OTP with anyone.
              </p>

              <p
                style="
                  margin: 22px 0 0;
                  padding-top: 20px;
                  border-top: 1px solid #eee7e1;
                  font-size: 13px;
                  line-height: 1.7;
                  color: #8b8179;
                "
              >
                If you did not request a password reset,
                you can safely ignore this email.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  sendEmail,
  sendPasswordResetOtpEmail,
};