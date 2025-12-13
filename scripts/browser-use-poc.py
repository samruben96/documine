#!/usr/bin/env python3
"""
Browser Use POC Script for docuMINE Quoting Module
Story Q7.1: Browser Use Local Setup & POC

This script validates Browser Use works for AI-powered browser automation
before full integration with the docuMINE quoting system.

Usage:
    python scripts/browser-use-poc.py [--headless]

Requirements:
    - Python 3.11+
    - pip install browser-use langchain-anthropic
    - playwright install chromium
    - ANTHROPIC_API_KEY in .env.local or environment

References:
    - Browser Use: https://browser-use.com/
    - Story: docs/sprint-artifacts/epics/epic-Q7/stories/Q7-1-browser-use-setup-poc/story.md
"""

import asyncio
import os
import sys
import argparse
from pathlib import Path
from datetime import datetime

# Load environment from .env.local
from dotenv import load_dotenv

# Find project root (where .env.local is)
project_root = Path(__file__).parent.parent
env_path = project_root / '.env.local'
if env_path.exists():
    load_dotenv(env_path)
else:
    print(f"Warning: .env.local not found at {env_path}")
    load_dotenv()  # Try default locations

# Import Browser Use
try:
    from browser_use import Agent, ChatAnthropic
except ImportError as e:
    print(f"Error: Missing dependency - {e}")
    print("Run: pip install browser-use")
    sys.exit(1)


def get_llm():
    """Initialize Claude LLM for Browser Use."""
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not set")
        print("Add to .env.local: ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    # Browser Use 0.11+ uses claude-sonnet-4-0 naming convention
    model = os.getenv('BROWSER_USE_MODEL', 'claude-sonnet-4-0')
    print(f"Using model: {model}")

    # Browser Use's ChatAnthropic reads ANTHROPIC_API_KEY from env automatically
    return ChatAnthropic(
        model=model,
        temperature=0.0,  # More deterministic for form filling
    )


async def run_search_poc(headless: bool = False) -> dict:
    """
    POC: Navigate to Google and perform a search.

    This validates:
    1. Browser Use can navigate to websites
    2. Browser Use can fill form fields
    3. Browser Use can extract data from results

    Args:
        headless: Run browser in headless mode (no visible window)

    Returns:
        dict with results including extracted data
    """
    print("\n" + "=" * 60)
    print("Browser Use POC - Search Test")
    print("=" * 60)
    print(f"Mode: {'Headless' if headless else 'Visible'}")
    print(f"Started: {datetime.now().isoformat()}")
    print()

    llm = get_llm()

    # Define the task for the AI agent
    task = """
    1. Go to google.com
    2. Search for 'insurance quote automation software'
    3. Wait for the search results to load
    4. Extract the titles and URLs of the first 3 organic search results (not ads)
    5. Return the extracted data in a structured format
    """

    agent = Agent(
        task=task,
        llm=llm,
        headless=headless,
    )

    print("Starting browser automation...")
    print(f"Task: {task.strip()}")
    print()

    try:
        result = await agent.run()

        print("\n" + "-" * 40)
        print("POC COMPLETED SUCCESSFULLY")
        print("-" * 40)
        print(f"Result type: {type(result)}")
        print(f"Result: {result}")

        return {
            'success': True,
            'result': result,
            'timestamp': datetime.now().isoformat(),
            'headless': headless,
        }

    except Exception as e:
        print(f"\nError during execution: {e}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat(),
            'headless': headless,
        }


async def run_form_fill_poc(headless: bool = False) -> dict:
    """
    POC: Navigate to a form and fill it out.

    Uses DuckDuckGo which has a simpler interface for testing.

    Args:
        headless: Run browser in headless mode

    Returns:
        dict with results
    """
    print("\n" + "=" * 60)
    print("Browser Use POC - Form Fill Test")
    print("=" * 60)
    print(f"Mode: {'Headless' if headless else 'Visible'}")
    print(f"Started: {datetime.now().isoformat()}")
    print()

    llm = get_llm()

    task = """
    1. Go to duckduckgo.com
    2. Type 'best insurance comparison tools 2024' in the search box
    3. Press Enter or click the search button
    4. Wait for results to load
    5. Tell me what the page title is and count how many results are visible
    """

    agent = Agent(
        task=task,
        llm=llm,
        headless=headless,
    )

    print("Starting form fill test...")
    print(f"Task: {task.strip()}")
    print()

    try:
        result = await agent.run()

        print("\n" + "-" * 40)
        print("FORM FILL POC COMPLETED")
        print("-" * 40)
        print(f"Result: {result}")

        return {
            'success': True,
            'result': result,
            'test': 'form_fill',
            'timestamp': datetime.now().isoformat(),
        }

    except Exception as e:
        print(f"\nError during form fill: {e}")
        return {
            'success': False,
            'error': str(e),
            'test': 'form_fill',
            'timestamp': datetime.now().isoformat(),
        }


async def main():
    """Main entry point for POC script."""
    parser = argparse.ArgumentParser(
        description='Browser Use POC for docuMINE Quoting',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Run with visible browser (default)
    python scripts/browser-use-poc.py

    # Run in headless mode (production-like)
    python scripts/browser-use-poc.py --headless

    # Run form fill test only
    python scripts/browser-use-poc.py --test form

    # Run all tests
    python scripts/browser-use-poc.py --test all
        """
    )

    parser.add_argument(
        '--headless',
        action='store_true',
        default=False,
        help='Run browser in headless mode (no visible window)'
    )

    parser.add_argument(
        '--test',
        choices=['search', 'form', 'all'],
        default='search',
        help='Which test to run (default: search)'
    )

    args = parser.parse_args()

    # Override headless from environment if set
    env_headless = os.getenv('BROWSER_USE_HEADLESS', '').lower()
    if env_headless == 'true':
        args.headless = True
    elif env_headless == 'false':
        args.headless = False

    print("=" * 60)
    print("Browser Use POC - docuMINE Quoting Module")
    print("=" * 60)
    print(f"Python: {sys.version}")
    print(f"Headless: {args.headless}")
    print(f"Test: {args.test}")
    print()

    results = []

    # Run selected tests
    if args.test in ['search', 'all']:
        result = await run_search_poc(headless=args.headless)
        results.append(result)

    if args.test in ['form', 'all']:
        result = await run_form_fill_poc(headless=args.headless)
        results.append(result)

    # Summary
    print("\n" + "=" * 60)
    print("POC SUMMARY")
    print("=" * 60)

    success_count = sum(1 for r in results if r.get('success'))
    total_count = len(results)

    for i, r in enumerate(results, 1):
        status = "✅ PASS" if r.get('success') else "❌ FAIL"
        test_name = r.get('test', 'search')
        print(f"{i}. {test_name}: {status}")
        if not r.get('success'):
            print(f"   Error: {r.get('error', 'Unknown')}")

    print()
    print(f"Total: {success_count}/{total_count} tests passed")
    print()

    # Return exit code based on results
    if success_count == total_count:
        print("🎉 All POC tests passed! Browser Use is ready for integration.")
        return 0
    else:
        print("⚠️ Some tests failed. Check errors above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
