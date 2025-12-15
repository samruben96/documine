#!/usr/bin/env python3
"""
Browser Use Runner Script
Story Q7.2: BrowserUseAdapter Implementation

Python subprocess runner for Browser Use AI agent.
Communicates with TypeScript BrowserUseAdapter via JSON over stdin/stdout.

Protocol:
  Input (stdin): JSON object with credentials and clientData
  Output (stdout): JSON lines with progress updates and final result

Usage:
    python browser_use_runner.py --carrier progressive --portal-url https://agents.progressive.com

Requirements:
    - Python 3.11+
    - pip install browser-use
    - playwright install chromium
    - ANTHROPIC_API_KEY in environment
"""

import asyncio
import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, TypedDict

# Load environment from .env.local in project root
from dotenv import load_dotenv

project_root = Path(__file__).parent.parent.parent.parent.parent
env_path = project_root / '.env.local'
if env_path.exists():
    load_dotenv(env_path)

# Import Browser Use - AC-Q7.2.6: Use browser_use.ChatAnthropic per Q7.1 learnings
try:
    from browser_use import Agent, ChatAnthropic
except ImportError as e:
    print(json.dumps({
        "type": "result",
        "success": False,
        "error": f"Missing dependency: {e}. Run: pip install browser-use"
    }))
    sys.exit(1)


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
        "STEPS:",
        f"1. Navigate to {portal_url}",
        f"2. Login with username '{credentials['username']}' and password (provided)",
        "3. Navigate to the new quote or get a quote section",
        f"4. Fill out the insurance quote form for client: {client_name}",
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
        "5. Complete all required form pages",
        "6. Navigate through to the quote results page",
        "7. Extract and report the premium amount, coverages, and deductibles",
        "",
        "When you reach the quote results, report the following:",
        "- Annual premium amount",
        "- Monthly premium amount (if shown)",
        "- Coverage limits",
        "- Deductible amounts"
    ])

    return "\n".join(task_lines)


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

    # Create and run agent
    agent = Agent(
        task=task,
        llm=llm,
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
        help='Carrier code (e.g., progressive, travelers)'
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
