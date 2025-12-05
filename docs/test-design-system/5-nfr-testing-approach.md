# 5. NFR Testing Approach

## 5.1 Security NFR Testing

| NFR | Test Type | Tool | Threshold |
|-----|-----------|------|-----------|
| Authentication enforcement | API Test | Playwright | All protected routes return 401 without token |
| Authorization (RBAC) | API Test | Playwright | Users cannot access resources outside their agency |
| JWT expiration | API Test | Playwright | Token expires after configured TTL |
| SQL injection | API Test | Playwright | Malicious inputs return error, not data |
| XSS prevention | E2E Test | Playwright | Script tags rendered as text, not executed |

## 5.2 Performance NFR Testing

| NFR | Test Type | Tool | Threshold |
|-----|-----------|------|-----------|
| First token latency | Load Test | k6 | P95 < 3 seconds (with mocked AI) |
| Document upload | Load Test | k6 | P95 < 30 seconds for 50-page PDF |
| API response time | Load Test | k6 | P95 < 500ms for standard endpoints |
| Concurrent users | Load Test | k6 | Support 50 concurrent users |
| Error rate | Load Test | k6 | < 1% under normal load |

**k6 Configuration:**
```javascript
export const options = {
  stages: [
    { duration: '1m', target: 25 },   // Ramp up
    { duration: '3m', target: 50 },   // Sustained load
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.01'],
  },
};
```

## 5.3 Reliability NFR Testing

| NFR | Test Type | Tool | Validation |
|-----|-----------|------|------------|
| AI service unavailable | E2E Test | Playwright | User sees friendly error, app remains functional |
| Network disconnection | E2E Test | Playwright | Offline indicator shown, reconnect works |
| Retry on transient failure | API Test | Playwright | 503 response triggers retry (up to 3 attempts) |
| Health check | API Test | Playwright | /api/health returns service status |

## 5.4 Maintainability NFR Testing

| NFR | Test Type | Tool | Threshold |
|-----|-----------|------|-----------|
| Test coverage | CI Job | Jest/Vitest | ≥ 80% line coverage |
| Code duplication | CI Job | jscpd | < 5% duplication |
| Vulnerability scan | CI Job | npm audit | 0 critical/high vulnerabilities |
| Error tracking | E2E Test | Playwright | Errors captured by Sentry/monitoring |

---
