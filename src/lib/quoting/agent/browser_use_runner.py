#!/usr/bin/env python3
"""
Browser Use Runner Script
Story Q7.2: BrowserUseAdapter Implementation
Story Q7.3: RAM Mutual Carrier + CAPTCHA Solving

Python subprocess runner for Browser Use AI agent.
Communicates with TypeScript BrowserUseAdapter via JSON over stdin/stdout.

Protocol:
  Input (stdin): JSON object with credentials and clientData
  Output (stdout): JSON lines with progress updates and final result

Usage:
    python browser_use_runner.py --carrier progressive --portal-url https://agents.progressive.com

Requirements:
    - Python 3.11+
    - pip install browser-use requests
    - playwright install chromium
    - ANTHROPIC_API_KEY in environment
    - CAPSOLVER_API_KEY in environment (for CAPTCHA solving)
"""

import asyncio
import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, TypedDict

import requests

# Load environment from .env.local in project root
from dotenv import load_dotenv

project_root = Path(__file__).parent.parent.parent.parent.parent
env_path = project_root / '.env.local'
if env_path.exists():
    load_dotenv(env_path)

# Import Browser Use - AC-Q7.2.6: Use browser_use.ChatAnthropic per Q7.1 learnings
try:
    from browser_use import Agent, ChatAnthropic, Controller, ActionResult
except ImportError as e:
    print(json.dumps({
        "type": "result",
        "success": False,
        "error": f"Missing dependency: {e}. Run: pip install browser-use"
    }))
    sys.exit(1)


# ============================================================================
# CAPTCHA Solving Integration (Story Q7.3)
# AC-Q7.3.5: CapSolver integration with Controller action
# AC-Q7.3.6: Support reCAPTCHA v2/v3 and Cloudflare Turnstile
# ============================================================================

CAPSOLVER_API_KEY = os.getenv('CAPSOLVER_API_KEY')
CAPSOLVER_API_URL = "https://api.capsolver.com"

# Create global controller for Browser Use
controller = Controller()


async def solve_recaptcha_v2(page_url: str, site_key: str) -> str | None:
    """
    Solve reCAPTCHA v2 via CapSolver API.

    Args:
        page_url: The URL where the CAPTCHA appears
        site_key: The reCAPTCHA site key

    Returns:
        The solved CAPTCHA token or None if failed
    """
    if not CAPSOLVER_API_KEY:
        emit_progress("CAPTCHA detected but CAPSOLVER_API_KEY not set", 40)
        return None

    emit_progress("Solving reCAPTCHA v2...", 42)

    try:
        # Create task
        create_payload = {
            "clientKey": CAPSOLVER_API_KEY,
            "task": {
                "type": "ReCaptchaV2TaskProxyLess",
                "websiteURL": page_url,
                "websiteKey": site_key,
            }
        }

        create_resp = requests.post(
            f"{CAPSOLVER_API_URL}/createTask",
            json=create_payload,
            timeout=30
        )
        create_data = create_resp.json()

        if create_data.get("errorId", 0) != 0:
            emit_progress(f"CapSolver error: {create_data.get('errorDescription', 'Unknown')}", 42)
            return None

        task_id = create_data.get("taskId")
        if not task_id:
            return None

        # Poll for result (max 120 seconds)
        for i in range(60):
            await asyncio.sleep(2)

            result_payload = {
                "clientKey": CAPSOLVER_API_KEY,
                "taskId": task_id
            }

            result_resp = requests.post(
                f"{CAPSOLVER_API_URL}/getTaskResult",
                json=result_payload,
                timeout=30
            )
            result_data = result_resp.json()

            status = result_data.get("status")
            if status == "ready":
                token = result_data.get("solution", {}).get("gRecaptchaResponse")
                if token:
                    emit_progress("reCAPTCHA v2 solved successfully", 45)
                    return token
            elif status == "failed":
                emit_progress("reCAPTCHA solving failed", 42)
                return None

            # Progress update during solve
            if i % 5 == 0:
                emit_progress(f"Solving reCAPTCHA... ({i*2}s)", 42 + (i // 10))

        emit_progress("reCAPTCHA solving timed out", 42)
        return None

    except Exception as e:
        emit_progress(f"CAPTCHA solve error: {str(e)}", 42)
        return None


async def solve_recaptcha_v3(page_url: str, site_key: str, action: str = "submit") -> str | None:
    """
    Solve reCAPTCHA v3 via CapSolver API.

    Args:
        page_url: The URL where the CAPTCHA appears
        site_key: The reCAPTCHA site key
        action: The reCAPTCHA action (default: "submit")

    Returns:
        The solved CAPTCHA token or None if failed
    """
    if not CAPSOLVER_API_KEY:
        return None

    emit_progress("Solving reCAPTCHA v3...", 42)

    try:
        create_payload = {
            "clientKey": CAPSOLVER_API_KEY,
            "task": {
                "type": "ReCaptchaV3TaskProxyLess",
                "websiteURL": page_url,
                "websiteKey": site_key,
                "pageAction": action,
                "minScore": 0.7,
            }
        }

        create_resp = requests.post(
            f"{CAPSOLVER_API_URL}/createTask",
            json=create_payload,
            timeout=30
        )
        create_data = create_resp.json()

        if create_data.get("errorId", 0) != 0:
            return None

        task_id = create_data.get("taskId")
        if not task_id:
            return None

        # Poll for result
        for _ in range(30):
            await asyncio.sleep(2)

            result_resp = requests.post(
                f"{CAPSOLVER_API_URL}/getTaskResult",
                json={"clientKey": CAPSOLVER_API_KEY, "taskId": task_id},
                timeout=30
            )
            result_data = result_resp.json()

            if result_data.get("status") == "ready":
                token = result_data.get("solution", {}).get("gRecaptchaResponse")
                if token:
                    emit_progress("reCAPTCHA v3 solved successfully", 45)
                    return token
            elif result_data.get("status") == "failed":
                return None

        return None

    except Exception:
        return None


async def solve_turnstile(page_url: str, site_key: str) -> str | None:
    """
    Solve Cloudflare Turnstile via CapSolver API.

    Args:
        page_url: The URL where the CAPTCHA appears
        site_key: The Turnstile site key

    Returns:
        The solved CAPTCHA token or None if failed
    """
    if not CAPSOLVER_API_KEY:
        return None

    emit_progress("Solving Cloudflare Turnstile...", 42)

    try:
        create_payload = {
            "clientKey": CAPSOLVER_API_KEY,
            "task": {
                "type": "AntiTurnstileTaskProxyLess",
                "websiteURL": page_url,
                "websiteKey": site_key,
            }
        }

        create_resp = requests.post(
            f"{CAPSOLVER_API_URL}/createTask",
            json=create_payload,
            timeout=30
        )
        create_data = create_resp.json()

        if create_data.get("errorId", 0) != 0:
            return None

        task_id = create_data.get("taskId")
        if not task_id:
            return None

        # Poll for result
        for _ in range(60):
            await asyncio.sleep(2)

            result_resp = requests.post(
                f"{CAPSOLVER_API_URL}/getTaskResult",
                json={"clientKey": CAPSOLVER_API_KEY, "taskId": task_id},
                timeout=30
            )
            result_data = result_resp.json()

            if result_data.get("status") == "ready":
                token = result_data.get("solution", {}).get("token")
                if token:
                    emit_progress("Turnstile solved successfully", 45)
                    return token
            elif result_data.get("status") == "failed":
                return None

        return None

    except Exception:
        return None


@controller.action('Solve any CAPTCHA on the page', domains=['*'])
async def solve_captcha(page) -> ActionResult:
    """
    Detect and solve CAPTCHAs on the current page.
    AC-Q7.3.5: Controller action for CAPTCHA solving.
    AC-Q7.3.6: Supports reCAPTCHA v2/v3 and Cloudflare Turnstile.

    This action is automatically available to the Browser Use agent
    and will be called when the agent detects a CAPTCHA challenge.
    """
    url = page.url
    emit_progress("Checking for CAPTCHA...", 40)

    try:
        # Check for reCAPTCHA v2 (visible checkbox or invisible)
        recaptcha_v2 = await page.query_selector('.g-recaptcha, [data-sitekey]:not(.cf-turnstile)')
        if recaptcha_v2:
            site_key = await recaptcha_v2.get_attribute('data-sitekey')
            if site_key:
                emit_progress("reCAPTCHA v2 detected, solving...", 41)
                token = await solve_recaptcha_v2(url, site_key)
                if token:
                    # Inject the token into the page
                    await page.evaluate(f"""
                        (function() {{
                            var response = document.getElementById('g-recaptcha-response');
                            if (response) {{
                                response.value = '{token}';
                            }}
                            // Also try textarea (invisible reCAPTCHA)
                            var textareas = document.querySelectorAll('textarea[name="g-recaptcha-response"]');
                            textareas.forEach(function(ta) {{
                                ta.value = '{token}';
                            }});
                        }})();
                    """)
                    return ActionResult(
                        success=True,
                        extracted_content='reCAPTCHA v2 solved and token injected'
                    )
                else:
                    return ActionResult(
                        success=False,
                        error='Failed to solve reCAPTCHA v2'
                    )

        # Check for reCAPTCHA v3 (usually invisible, look for grecaptcha script)
        recaptcha_v3_script = await page.query_selector('script[src*="recaptcha/api.js?render="]')
        if recaptcha_v3_script:
            src = await recaptcha_v3_script.get_attribute('src')
            if src and 'render=' in src:
                site_key = src.split('render=')[1].split('&')[0]
                emit_progress("reCAPTCHA v3 detected, solving...", 41)
                token = await solve_recaptcha_v3(url, site_key)
                if token:
                    # For v3, we typically need to call a callback
                    await page.evaluate(f"""
                        window.captchaToken = '{token}';
                    """)
                    return ActionResult(
                        success=True,
                        extracted_content='reCAPTCHA v3 solved, token stored in window.captchaToken'
                    )

        # Check for Cloudflare Turnstile
        turnstile = await page.query_selector('.cf-turnstile, [data-sitekey][class*="turnstile"]')
        if turnstile:
            site_key = await turnstile.get_attribute('data-sitekey')
            if site_key:
                emit_progress("Cloudflare Turnstile detected, solving...", 41)
                token = await solve_turnstile(url, site_key)
                if token:
                    # Inject Turnstile token
                    await page.evaluate(f"""
                        (function() {{
                            var input = document.querySelector('input[name="cf-turnstile-response"]');
                            if (input) {{
                                input.value = '{token}';
                            }}
                        }})();
                    """)
                    return ActionResult(
                        success=True,
                        extracted_content='Cloudflare Turnstile solved and token injected'
                    )
                else:
                    return ActionResult(
                        success=False,
                        error='Failed to solve Turnstile'
                    )

        # Check for hCaptcha
        hcaptcha = await page.query_selector('.h-captcha, [data-sitekey][class*="hcaptcha"]')
        if hcaptcha:
            emit_progress("hCaptcha detected - not yet supported", 41)
            return ActionResult(
                success=False,
                error='hCaptcha detected but not yet supported. Manual intervention may be needed.'
            )

        # No CAPTCHA detected
        return ActionResult(
            success=True,
            extracted_content='No CAPTCHA detected on this page'
        )

    except Exception as e:
        return ActionResult(
            success=False,
            error=f'Error checking for CAPTCHA: {str(e)}'
        )


# ============================================================================
# Type Definitions
# ============================================================================

class Credentials(TypedDict):
    """Carrier portal credentials."""
    username: str
    password: str
    mfaCode: str | None


class ClientPersonal(TypedDict, total=False):
    """Personal client data."""
    firstName: str
    lastName: str
    email: str
    phone: str
    dateOfBirth: str


class ClientData(TypedDict, total=False):
    """Full client data structure."""
    personal: ClientPersonal
    property: dict[str, Any]
    auto: dict[str, Any]
    drivers: list[dict[str, Any]]


class InputData(TypedDict):
    """Input structure from TypeScript adapter."""
    credentials: Credentials
    clientData: ClientData
    sessionId: str
    carrierCode: str


# ============================================================================
# Progress and Result Emission
# ============================================================================

def emit_progress(step: str, progress: int) -> None:
    """
    Emit progress update via JSON line to stdout.
    AC-Q7.2.4: Progress updates as JSON lines.

    Args:
        step: Current step description
        progress: Progress percentage (0-100)
    """
    output = {
        "type": "progress",
        "step": step,
        "progress": progress,
        "timestamp": datetime.now().isoformat()
    }
    print(json.dumps(output), flush=True)


def emit_result(success: bool, data: dict[str, Any] | None = None, error: str | None = None) -> None:
    """
    Emit final result via JSON line to stdout.
    AC-Q7.2.5: Final result with success/failure and data.

    Args:
        success: Whether execution succeeded
        data: Extracted quote data (on success)
        error: Error message (on failure)
    """
    output: dict[str, Any] = {
        "type": "result",
        "success": success,
        "timestamp": datetime.now().isoformat()
    }
    if data is not None:
        output["data"] = data
    if error is not None:
        output["error"] = error

    print(json.dumps(output), flush=True)


# ============================================================================
# LLM and Task Building
# ============================================================================

def get_llm() -> ChatAnthropic:
    """
    Initialize Claude LLM for Browser Use.
    AC-Q7.2.7: Use claude-sonnet-4-5 model (not deprecated model per Q7.1 learnings).
    """
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY not set in environment")

    # Browser Use 0.11+ uses claude-sonnet-4-5 (not claude-3-5-sonnet-20241022)
    model = os.getenv('BROWSER_USE_MODEL', 'claude-sonnet-4-5')

    return ChatAnthropic(
        model=model,
        temperature=0.0,  # Deterministic for form filling
    )


def build_navigation_task(carrier: str, portal_url: str, client_data: ClientData, credentials: Credentials) -> str:
    """
    Build the navigation task prompt for Browser Use.

    Args:
        carrier: Carrier code (e.g., 'progressive')
        portal_url: Carrier portal URL
        client_data: Client information for form filling
        credentials: Portal login credentials
    """
    # Get client name for the task
    personal = client_data.get('personal', {})
    client_name = f"{personal.get('firstName', '')} {personal.get('lastName', '')}".strip() or "the insured"

    # Build detailed task with client data
    task_lines = [
        f"You are filling out an insurance quote form on {carrier.title()} portal.",
        "",
        "IMPORTANT: Do not share or display credentials in any output.",
        "",
        "CAPTCHA HANDLING: If you encounter a CAPTCHA, use the 'Solve any CAPTCHA on the page' action.",
        "",
        "STEPS:",
        f"1. Navigate to {portal_url}",
        f"2. Login with username '{credentials['username']}' and password (provided)",
        "3. If CAPTCHA appears, use the solve_captcha action",
        "4. Navigate to the new quote or get a quote section",
        f"5. Fill out the insurance quote form for client: {client_name}",
        "",
        "CLIENT INFORMATION TO USE:",
    ]

    # Add personal info
    if personal:
        if personal.get('firstName'):
            task_lines.append(f"- First Name: {personal['firstName']}")
        if personal.get('lastName'):
            task_lines.append(f"- Last Name: {personal['lastName']}")
        if personal.get('email'):
            task_lines.append(f"- Email: {personal['email']}")
        if personal.get('phone'):
            task_lines.append(f"- Phone: {personal['phone']}")
        if personal.get('dateOfBirth'):
            task_lines.append(f"- Date of Birth: {personal['dateOfBirth']}")

    # Add property info if present
    if 'property' in client_data and client_data['property']:
        task_lines.append("")
        task_lines.append("PROPERTY INFORMATION:")
        for key, value in client_data['property'].items():
            task_lines.append(f"- {key}: {value}")

    # Add auto info if present
    if 'auto' in client_data and client_data['auto']:
        task_lines.append("")
        task_lines.append("AUTO/VEHICLE INFORMATION:")
        for key, value in client_data['auto'].items():
            task_lines.append(f"- {key}: {value}")

    # Add drivers if present
    if 'drivers' in client_data and client_data['drivers']:
        task_lines.append("")
        task_lines.append("DRIVER INFORMATION:")
        for i, driver in enumerate(client_data['drivers'], 1):
            task_lines.append(f"  Driver {i}:")
            for key, value in driver.items():
                task_lines.append(f"    - {key}: {value}")

    # Final instructions
    task_lines.extend([
        "",
        "FINAL STEPS:",
        "6. Complete all required form pages",
        "7. Navigate through to the quote results page",
        "8. Extract and report the premium amount, coverages, and deductibles",
        "",
        "When you reach the quote results, report the following:",
        "- Annual premium amount",
        "- Monthly premium amount (if shown)",
        "- Coverage limits",
        "- Deductible amounts"
    ])

    return "\n".join(task_lines)


# ============================================================================
# Quote Data Extraction
# ============================================================================

def extract_quote_data(result: Any, carrier: str) -> dict[str, Any]:
    """
    Extract structured quote data from Browser Use result.

    Args:
        result: Raw result from Browser Use agent
        carrier: Carrier code for the result

    Returns:
        Structured quote data dictionary
    """
    # Browser Use returns the agent's final response
    result_text = str(result) if result else ""

    # Attempt to parse currency values from result
    import re

    def parse_currency(text: str) -> float | None:
        """Extract currency value from text."""
        # Match patterns like $1,234.56 or 1234.56
        match = re.search(r'\$?([\d,]+\.?\d*)', text)
        if match:
            value = match.group(1).replace(',', '')
            try:
                return float(value)
            except ValueError:
                return None
        return None

    # Try to extract premium
    premium_annual = None
    premium_monthly = None

    # Look for annual premium patterns
    annual_patterns = [
        r'annual(?:\s+premium)?[:\s]*\$?([\d,]+\.?\d*)',
        r'yearly(?:\s+premium)?[:\s]*\$?([\d,]+\.?\d*)',
        r'per\s+year[:\s]*\$?([\d,]+\.?\d*)',
        r'\$?([\d,]+\.?\d*)\s*(?:per\s+)?(?:year|annually)',
    ]

    for pattern in annual_patterns:
        match = re.search(pattern, result_text, re.IGNORECASE)
        if match:
            try:
                premium_annual = float(match.group(1).replace(',', ''))
                break
            except ValueError:
                continue

    # Look for monthly premium patterns
    monthly_patterns = [
        r'monthly(?:\s+premium)?[:\s]*\$?([\d,]+\.?\d*)',
        r'per\s+month[:\s]*\$?([\d,]+\.?\d*)',
        r'\$?([\d,]+\.?\d*)\s*(?:per\s+)?month',
    ]

    for pattern in monthly_patterns:
        match = re.search(pattern, result_text, re.IGNORECASE)
        if match:
            try:
                premium_monthly = float(match.group(1).replace(',', ''))
                break
            except ValueError:
                continue

    # Calculate monthly from annual if not found
    if premium_annual and not premium_monthly:
        premium_monthly = round(premium_annual / 12, 2)

    return {
        "carrierCode": carrier,
        "premiumAnnual": premium_annual,
        "premiumMonthly": premium_monthly,
        "coverages": {},  # Would need more parsing for detailed coverages
        "deductibles": {},  # Would need more parsing for deductibles
        "rawExtractedData": {
            "agentResponse": result_text[:2000] if result_text else None  # Truncate for size
        },
        "extractedAt": datetime.now().isoformat()
    }


# ============================================================================
# Main Runner
# ============================================================================

async def run_browser_use(
    carrier: str,
    portal_url: str,
    input_data: InputData,
    headless: bool = True
) -> None:
    """
    Run Browser Use agent to fill carrier quote form.

    Args:
        carrier: Carrier code
        portal_url: Portal URL to navigate to
        input_data: Credentials and client data from stdin
        headless: Run browser in headless mode
    """
    emit_progress("Initializing Browser Use agent", 5)

    try:
        llm = get_llm()
    except RuntimeError as e:
        emit_result(False, error=str(e))
        return

    emit_progress("Building navigation task", 10)

    # Build the task prompt
    task = build_navigation_task(
        carrier=carrier,
        portal_url=portal_url,
        client_data=input_data['clientData'],
        credentials=input_data['credentials']
    )

    emit_progress("Starting browser automation", 15)

    # Create and run agent with CAPTCHA-solving controller
    # AC-Q7.3.5: Pass controller to Agent
    agent = Agent(
        task=task,
        llm=llm,
        controller=controller,  # Enable CAPTCHA solving actions
        headless=headless,
    )

    emit_progress("Navigating to carrier portal", 25)

    try:
        emit_progress("Logging into portal", 35)
        emit_progress("Filling quote form", 50)

        # Run the agent
        result = await agent.run()

        emit_progress("Extracting quote data", 85)

        # Extract structured data from result
        quote_data = extract_quote_data(result, carrier)

        emit_progress("Quote extraction complete", 100)
        emit_result(True, data=quote_data)

    except Exception as e:
        error_msg = str(e)

        # Categorize error for TypeScript error mapping
        # AC-Q7.2.8: Error categorization
        if any(term in error_msg.lower() for term in ['login', 'credential', 'authentication', 'password', 'unauthorized']):
            emit_result(False, error=f"login failed: {error_msg}")
        elif any(term in error_msg.lower() for term in ['captcha', 'challenge', 'recaptcha', 'hcaptcha']):
            emit_result(False, error=f"captcha detected: {error_msg}")
        elif any(term in error_msg.lower() for term in ['element not found', 'selector', 'form changed', 'navigation failed']):
            emit_result(False, error=f"element not found: {error_msg}")
        elif any(term in error_msg.lower() for term in ['timeout', 'timed out']):
            emit_result(False, error=f"timeout: {error_msg}")
        elif any(term in error_msg.lower() for term in ['connection', 'network', 'unavailable', '503', '502']):
            emit_result(False, error=f"connection failed: {error_msg}")
        else:
            emit_result(False, error=error_msg)


def read_input_from_stdin() -> InputData | None:
    """
    Read JSON input from stdin.
    AC-Q7.2.3: JSON input via stdin with credentials and clientData.

    Returns:
        Parsed input data or None if parsing fails
    """
    try:
        # Read all input from stdin
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            emit_result(False, error="No input received on stdin")
            return None

        data = json.loads(raw_input)

        # Validate required fields
        if 'credentials' not in data:
            emit_result(False, error="Missing 'credentials' in input")
            return None
        if 'clientData' not in data:
            emit_result(False, error="Missing 'clientData' in input")
            return None

        return data

    except json.JSONDecodeError as e:
        emit_result(False, error=f"Invalid JSON input: {e}")
        return None


def main() -> int:
    """
    Main entry point for Browser Use runner.
    AC-Q7.2.2: Argument parsing for --carrier and --portal-url.
    """
    parser = argparse.ArgumentParser(
        description='Browser Use runner for quote automation',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        '--carrier',
        required=True,
        help='Carrier code (e.g., progressive, travelers, ram-mutual)'
    )

    parser.add_argument(
        '--portal-url',
        required=True,
        help='Carrier portal URL'
    )

    parser.add_argument(
        '--headless',
        action='store_true',
        default=True,
        help='Run browser in headless mode (default: true)'
    )

    parser.add_argument(
        '--visible',
        action='store_true',
        help='Run browser with visible window (for debugging)'
    )

    args = parser.parse_args()

    # Handle headless vs visible
    headless = not args.visible

    # Log CAPTCHA solver status
    if CAPSOLVER_API_KEY:
        print(json.dumps({
            "type": "progress",
            "step": "CAPTCHA solver enabled (CapSolver)",
            "progress": 0,
            "timestamp": datetime.now().isoformat()
        }), flush=True)
    else:
        print(json.dumps({
            "type": "progress",
            "step": "CAPTCHA solver not configured (set CAPSOLVER_API_KEY)",
            "progress": 0,
            "timestamp": datetime.now().isoformat()
        }), flush=True)

    # Read input from stdin
    input_data = read_input_from_stdin()
    if input_data is None:
        return 1

    # Run the browser automation
    try:
        asyncio.run(run_browser_use(
            carrier=args.carrier,
            portal_url=args.portal_url,
            input_data=input_data,
            headless=headless
        ))
        return 0
    except KeyboardInterrupt:
        emit_result(False, error="Process interrupted")
        return 130
    except Exception as e:
        emit_result(False, error=f"Unexpected error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
