# Story Q7-3: RAM Mutual Carrier + CAPTCHA Solving

Status: done

## Story

**As a** user
**I want** RAM Mutual added as a supported carrier with automated CAPTCHA solving
**So that** I can get quotes from RAM Mutual via AI automation without manual CAPTCHA intervention

## Acceptance Criteria

| AC# | Criteria | Testable |
|-----|----------|----------|
| AC-Q7.3.1 | RAM Mutual added to CARRIERS registry with code 'ram-mutual', portal URL, logo | Unit test |
| AC-Q7.3.2 | Clipboard formatter outputs RAM Mutual format with proper field order | Unit test |
| AC-Q7.3.3 | generatePreview() creates UI preview for carrier preview modal | Unit test |
| AC-Q7.3.4 | validateRequiredFields() checks RAM Mutual required fields | Unit test |
| AC-Q7.3.5 | CapSolver integration added to browser_use_runner.py with Controller action | Unit test |
| AC-Q7.3.6 | CAPTCHA solver supports reCAPTCHA v2/v3 and Cloudflare Turnstile | Unit test |
| AC-Q7.3.7 | CAPSOLVER_API_KEY documented in .env.example | Manual check |
| AC-Q7.3.8 | Carrier appears in Carriers tab with logo and status | Manual test |

## Tasks / Subtasks

- [ ] Task 1: Carrier Registry Entry (AC: #1, #8)
  - [ ] 1.1: Add RAM Mutual to `CARRIERS` in `src/lib/quoting/carriers/index.ts`
  - [ ] 1.2: Set carrier code: `ram-mutual`
  - [ ] 1.3: Set display name: `RAM Mutual`
  - [ ] 1.4: Configure portal URL: `https://www.rfrm.com/agents`
  - [ ] 1.5: Add logo SVG to `/public/carriers/ram-mutual.svg`
  - [ ] 1.6: Set lines of business: `['auto', 'home']`

- [ ] Task 2: Clipboard Formatter (AC: #2, #3, #4)
  - [ ] 2.1: Create `src/lib/quoting/carriers/ram-mutual.ts`
  - [ ] 2.2: Implement `formatForClipboard()` with RAM Mutual field order
  - [ ] 2.3: Implement `generatePreview()` for UI display
  - [ ] 2.4: Implement `validateRequiredFields()` for required field checking
  - [ ] 2.5: Export formatter and register in carriers index

- [ ] Task 3: CAPTCHA Solving Integration (AC: #5, #6, #7)
  - [ ] 3.1: Add CapSolver API client to `browser_use_runner.py`
  - [ ] 3.2: Create Browser Use Controller with `solve_captcha` action
  - [ ] 3.3: Implement reCAPTCHA v2 solver
  - [ ] 3.4: Implement reCAPTCHA v3 solver
  - [ ] 3.5: Implement Cloudflare Turnstile solver
  - [ ] 3.6: Pass Controller to Agent in browser_use_runner.py
  - [ ] 3.7: Add CAPSOLVER_API_KEY to .env.example

- [ ] Task 4: Unit Tests
  - [ ] 4.1: Create `__tests__/lib/quoting/carriers/ram-mutual.test.ts`
  - [ ] 4.2: Test formatForClipboard() output format
  - [ ] 4.3: Test generatePreview() returns correct structure
  - [ ] 4.4: Test validateRequiredFields() catches missing required fields

## Dev Notes

### RAM Mutual Portal Info

- **Company:** RAM Mutual Insurance Company
- **Portal URL:** https://www.rfrm.com/agents
- **Headquarters:** Evansville, Wisconsin
- **Lines:** Auto, Home, Farm, Umbrella
- **Focus:** Personal lines in Wisconsin/Illinois

### CapSolver Integration

CapSolver is a CAPTCHA solving service that supports:
- reCAPTCHA v2 (checkbox and invisible)
- reCAPTCHA v3
- Cloudflare Turnstile
- hCaptcha

API docs: https://docs.capsolver.com/

```python
# browser_use_runner.py - CAPTCHA solving
import requests
from browser_use import Controller, ActionResult

CAPSOLVER_API_KEY = os.getenv('CAPSOLVER_API_KEY')

controller = Controller()

@controller.action('Solve CAPTCHA on the page', domains=['*'])
async def solve_captcha(page) -> ActionResult:
    """Detect and solve CAPTCHAs using CapSolver API."""
    url = page.url

    # Check for reCAPTCHA v2
    recaptcha_el = await page.query_selector('.g-recaptcha, [data-sitekey]')
    if recaptcha_el:
        site_key = await recaptcha_el.get_attribute('data-sitekey')
        if site_key:
            token = await solve_recaptcha_v2(url, site_key)
            if token:
                await page.evaluate(f"document.getElementById('g-recaptcha-response').value = '{token}'")
                return ActionResult(success=True, extracted_content='reCAPTCHA solved')

    # Check for Cloudflare Turnstile
    turnstile_el = await page.query_selector('.cf-turnstile, [data-sitekey]')
    if turnstile_el:
        site_key = await turnstile_el.get_attribute('data-sitekey')
        if site_key:
            token = await solve_turnstile(url, site_key)
            if token:
                # Inject token
                return ActionResult(success=True, extracted_content='Turnstile solved')

    return ActionResult(success=True, extracted_content='No CAPTCHA detected')

async def solve_recaptcha_v2(page_url: str, site_key: str) -> str | None:
    """Solve reCAPTCHA v2 via CapSolver."""
    payload = {
        "clientKey": CAPSOLVER_API_KEY,
        "task": {
            "type": "ReCaptchaV2TaskProxyLess",
            "websiteURL": page_url,
            "websiteKey": site_key,
        }
    }
    # Create task
    resp = requests.post("https://api.capsolver.com/createTask", json=payload)
    task_id = resp.json().get("taskId")

    # Poll for result
    for _ in range(60):
        result = requests.post("https://api.capsolver.com/getTaskResult", json={
            "clientKey": CAPSOLVER_API_KEY,
            "taskId": task_id
        }).json()
        if result.get("status") == "ready":
            return result.get("solution", {}).get("gRecaptchaResponse")
        await asyncio.sleep(2)
    return None
```

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/quoting/carriers/ram-mutual.ts` | Create | Formatter implementation |
| `src/lib/quoting/carriers/index.ts` | Modify | Add to registry |
| `public/carriers/ram-mutual.svg` | Create | Carrier logo |
| `src/lib/quoting/agent/browser_use_runner.py` | Modify | Add CAPTCHA solving |
| `__tests__/lib/quoting/carriers/ram-mutual.test.ts` | Create | Unit tests |
| `.env.example` | Modify | Document CAPSOLVER_API_KEY |

### Environment Variables

```bash
# .env.example addition
CAPSOLVER_API_KEY=your_capsolver_api_key
```

### References

- Existing formatters: `src/lib/quoting/carriers/progressive.ts`, `travelers.ts`
- Carrier types: `src/lib/quoting/carriers/types.ts`
- CapSolver docs: https://docs.capsolver.com/
- Browser Use Controller docs: https://browser-use.com/

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-12 | Story drafted | SM Agent |
| 2025-12-14 | Updated with CAPTCHA solving (CapSolver) | Dev Agent |
