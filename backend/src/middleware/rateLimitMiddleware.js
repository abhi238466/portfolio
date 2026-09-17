const rateLimit = require("express-rate-limit");

/*
|--------------------------------------------------------------------------
| Admin Login Rate Limiter
|--------------------------------------------------------------------------
|
| Purpose:
| Protect the admin login endpoint against:
|
| - Brute-force password attacks
| - Automated login attempts
| - Repeated requests from the same IP
| - Credential stuffing attempts
|
| Configuration:
| - Maximum 5 login requests
| - Within a 15-minute window
| - After the limit is reached, the client must wait
|   until the current window expires.
|
|--------------------------------------------------------------------------
*/

const adminLoginRateLimiter = rateLimit({
  /*
  |--------------------------------------------------------------------------
  | Time Window
  |--------------------------------------------------------------------------
  |
  | 15 minutes = 15 × 60 × 1000 milliseconds
  |
  */

  windowMs: 15 * 60 * 1000,

  /*
  |--------------------------------------------------------------------------
  | Maximum Requests
  |--------------------------------------------------------------------------
  |
  | A maximum of 5 login requests are allowed from
  | the same IP during the configured time window.
  |
  */

  limit: 5,

  /*
  |--------------------------------------------------------------------------
  | Standard Rate Limit Headers
  |--------------------------------------------------------------------------
  |
  | Sends standard RateLimit headers to the client.
  |
  */

  standardHeaders: "draft-8",

  /*
  |--------------------------------------------------------------------------
  | Disable Legacy Headers
  |--------------------------------------------------------------------------
  */

  legacyHeaders: false,

  /*
  |--------------------------------------------------------------------------
  | Skip Successful Requests
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | We don't want successful login attempts to consume
  | the complete security allowance.
  |
  | Only failed/repeated login requests should contribute
  | toward the protection mechanism.
  |
  | This value will be controlled by the route response
  | status through the request context.
  |
  */

  skipSuccessfulRequests: true,

  /*
  |--------------------------------------------------------------------------
  | Custom Rate Limit Handler
  |--------------------------------------------------------------------------
  |
  | This runs when the configured request limit is reached.
  |
  | We calculate the exact remaining wait time from the
  | rate-limit reset timestamp.
  |
  */

  handler: (req, res) => {
    const resetTime = req.rateLimit?.resetTime;

    let retryAfterSeconds = 15 * 60;

    if (resetTime) {
      const remainingMilliseconds =
        new Date(resetTime).getTime() - Date.now();

      retryAfterSeconds = Math.max(
        1,
        Math.ceil(remainingMilliseconds / 1000)
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Convert Remaining Seconds
    |--------------------------------------------------------------------------
    */

    const remainingMinutes = Math.floor(
      retryAfterSeconds / 60
    );

    const remainingSeconds =
      retryAfterSeconds % 60;

    /*
    |--------------------------------------------------------------------------
    | Human-Friendly Retry Message
    |--------------------------------------------------------------------------
    */

    let retryMessage;

    if (remainingMinutes > 0) {
      retryMessage = `Please try again in ${remainingMinutes} minute${
        remainingMinutes !== 1 ? "s" : ""
      }${
        remainingSeconds > 0
          ? ` ${remainingSeconds} second${
              remainingSeconds !== 1 ? "s" : ""
            }`
          : ""
      }.`;
    } else {
      retryMessage = `Please try again in ${remainingSeconds} second${
        remainingSeconds !== 1 ? "s" : ""
      }.`;
    }

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(429).json({
      success: false,

      code: "ADMIN_LOGIN_RATE_LIMITED",

      message:
        `🛡️ Too many unsuccessful login attempts. ${retryMessage}`,

      retryAfterSeconds,

      retryAfter: new Date(
        Date.now() + retryAfterSeconds * 1000
      ).toISOString(),
    });
  },

  /*
  |--------------------------------------------------------------------------
  | General Message
  |--------------------------------------------------------------------------
  */

  message: {
    success: false,

    code: "ADMIN_LOGIN_RATE_LIMITED",

    message:
      "🛡️ Too many unsuccessful login attempts. Please try again later.",
  },
});

/*
|--------------------------------------------------------------------------
| Export Middleware
|--------------------------------------------------------------------------
*/

module.exports = {
  adminLoginRateLimiter,
};