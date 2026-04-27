# Twilio OTP Integration Guide

Your OTP Auth API already has complete Twilio SMS provider support. Here's how to set it up:

## Quick Start

### 1. Get Your Twilio Credentials

1. Sign up at [Twilio Console](https://console.twilio.com/)
2. Get your **Account SID** from the dashboard
3. Get your **Auth Token** (or use API Keys)
4. Buy a phone number with SMS capabilities

### 2. Configure Environment Variables

Edit your `.env` file:

```bash
# OTP Provider - set to 'twilio' for SMS
OTP_PROVIDER=twilio

# SMS Provider Configuration
SMS_PROVIDER=twilio
SMS_ACCOUNT_SID=your_account_sid_here
SMS_AUTH_TOKEN=your_auth_token_here
SMS_PHONE_NUMBER=+1234567890  # Your Twilio phone number in E.164 format
```

### 3. Restart Your Server

```bash
npm run dev
```

## Testing the Integration

### Send OTP via Twilio SMS

```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "+1234567890",
    "identifierType": "phone"
  }'
```

### Verify OTP

```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "+1234567890",
    "otp": "123456"
  }'
```

## API Endpoints

### POST /api/auth/send-otp
Send OTP to user's phone number

**Request:**
```json
{
  "identifier": "+1234567890",
  "identifierType": "phone"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to +1234567890",
  "requestId": "req_abc123"
}
```

### POST /api/auth/verify-otp
Verify the OTP code

**Request:**
```json
{
  "identifier": "+1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "user": { "identifier": "+1234567890" },
    "token": "jwt.token.here"
  },
  "requestId": "req_abc123"
}
```

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `OTP_DIGITS` | Number of OTP digits | 6 |
| `OTP_EXPIRY_SECONDS` | OTP validity period | 300 (5 min) |
| `OTP_MAX_ATTEMPTS` | Max verification attempts | 5 |
| `OTP_RESEND_COOLDOWN_SECONDS` | Wait time before resend | 60 (1 min) |
| `SMS_PROVIDER` | SMS service (twilio only) | twilio |
| `SMS_ACCOUNT_SID` | Twilio Account SID | - |
| `SMS_AUTH_TOKEN` | Twilio Auth Token | - |
| `SMS_PHONE_NUMBER` | Twilio phone number | - |

## Phone Number Format

Use E.164 format: `+[country code][number]`

Examples:
- US: `+14155552671`
- UK: `+447911123456`
- India: `+919876543210`

## Error Handling

The API returns appropriate error codes:

- `400` - Invalid phone number or OTP format
- `429` - Rate limit exceeded (too many requests or attempts)
- `400` - OTP expired
- `500` - Twilio service error

## Development Without Twilio

For development, use the mock provider:

```bash
OTP_PROVIDER=mock
```

This logs OTP codes to console without sending SMS.

## Production Checklist

- [ ] Twilio Account SID configured
- [ ] Twilio Auth Token configured
- [ ] Twilio phone number purchased and verified
- [ ] SMS_PHONE_NUMBER in E.164 format
- [ ] JWT_SECRET changed from default
- [ ] NODE_ENV=production
- [ ] Redis connected for OTP storage
- [ ] Rate limiting configured
- [ ] Test sending OTP to your phone

## Troubleshooting

### SMS Not Sending

1. Check Twilio account has credits
2. Verify phone number is SMS-capable
3. Check phone number format (E.164)
4. Review logs for Twilio error messages

### Invalid Phone Number Error

- Use E.164 format: `+[country code][number]`
- Don't include spaces, dashes, or parentheses
- Example: `+1234567890`

### Twilio Authentication Failed

- Verify Account SID and Auth Token
- Check for trailing spaces in .env values
- Restart server after changing .env

## Integration with Flutter

Your Flutter app should:

1. Call `/api/auth/send-otp` with phone number
2. Receive success response
3. Prompt user for OTP code
4. Call `/api/auth/verify-otp` with code
5. Store JWT token for authenticated requests

## Additional Resources

- [Twilio Node.js Docs](https://www.twilio.com/docs/libraries/node)
- [Twilio Error Codes](https://www.twilio.com/docs/messaging/errors)
- [E.164 Format Guide](https://www.twilio.com/docs/glossary/what-e164)
