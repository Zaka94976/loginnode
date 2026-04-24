# Flutter Integration Guide

## API Endpoints

### Base URL

```
Development: http://localhost:3000/api
Production:  https://your-api-domain.com/api
```

---

## 1. Send OTP

### Request

```dart
// Flutter (Dart) HTTP Client Example
import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthApi {
  static const String baseUrl = 'http://localhost:3000/api';

  Future<Map<String, dynamic>> sendOTP(String email) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/send-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'identifier': email}),
    );

    return jsonDecode(response.body);
  }
}
```

### Request JSON

```json
{
  "identifier": "user@example.com"
}
```

### Response (Success)

```json
{
  "success": true,
  "message": "OTP sent successfully to user@example.com",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response (Error)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Please wait 45 seconds before requesting a new OTP"
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 2. Verify OTP

### Request

```dart
Future<Map<String, dynamic>> verifyOTP(String email, String otp) async {
  final response = await http.post(
    Uri.parse('$baseUrl/auth/verify-otp'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'identifier': email,
      'otp': otp
    }),
  );

  return jsonDecode(response.body);
}
```

### Request JSON

```json
{
  "identifier": "user@example.com",
  "otp": "123456"
}
```

### Response (Success)

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "user": {
      "identifier": "user@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response (Error)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_OTP",
    "message": "Invalid OTP. 4 attempts remaining"
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 3. Secure Token Storage

### Store JWT Token

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  static const String _tokenKey = 'jwt_token';

  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  Future<bool> hasToken() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}
```

---

## 4. Authenticated API Calls

### Add Token to Requests

```dart
class AuthenticatedApi {
  final TokenStorage _tokenStorage = TokenStorage();
  static const String baseUrl = 'http://localhost:3000/api';

  Future<Map<String, dynamic>> authenticatedGet(
    String endpoint,
  ) async {
    final token = await _tokenStorage.getToken();

    final response = await http.get(
      Uri.parse('$baseUrl$endpoint'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 401) {
      // Token expired - handle re-authentication
      await _tokenStorage.deleteToken();
      throw Exception('Authentication required');
    }

    return jsonDecode(response.body);
  }
}
```

---

## 5. Complete Auth Service

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AuthService {
  static const String _baseUrl = 'http://localhost:3000/api';
  static const _tokenKey = 'jwt_token';

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock_this_device),
  );

  Future<void> sendOTP(String email) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/send-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'identifier': email}),
    );

    final data = jsonDecode(response.body);
    if (!data['success']) {
      throw Exception(data['error']['message']);
    }
  }

  Future<bool> verifyOTP(String email, String otp) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/verify-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'identifier': email, 'otp': otp}),
    );

    final data = jsonDecode(response.body);
    if (data['success']) {
      await _storage.write(key: _tokenKey, value: data['data']['token']);
      return true;
    }
    return false;
  }

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: _tokenKey);
    return token != null && token.isNotEmpty;
  }

  Future<void> logout() async {
    await _storage.delete(key: _tokenKey);
  }
}
```

---

## Error Codes Reference

| Code                    | Meaning                  | Action               |
| ----------------------- | ------------------------ | -------------------- |
| `VALIDATION_ERROR`      | Invalid input            | Show error message   |
| `INVALID_IDENTIFIER`    | Wrong email/phone format | Prompt user          |
| `RATE_LIMITED`          | Too many OTPs sent       | Show cooldown        |
| `OTP_EXPIRED`           | OTP too old (5 min)      | Request new OTP      |
| `INVALID_OTP`           | Wrong code entered       | Show attempts left   |
| `MAX_ATTEMPTS_EXCEEDED` | Too many wrong attempts  | Block for cooldown   |
| `NO_TOKEN`              | Not authenticated        | Redirect to login    |
| `INTERNAL_ERROR`        | Server error             | Show generic message |

---

## Security Best Practices

1. **Never store tokens in plain text** - Use `flutter_secure_storage`
2. **Always use HTTPS in production**
3. **Clear token on logout**
4. **Handle 401 responses** - Redirect to login
5. **Implement Biometric Auth** - Optional extra layer
