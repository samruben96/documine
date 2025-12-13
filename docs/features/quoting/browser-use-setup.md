# Browser Use Setup Guide

> AI-powered browser automation for the docuMINE Quoting Module.

## Overview

Browser Use is a Python library that enables AI-driven browser automation. It uses large language models (Claude, GPT-4, Gemini) to understand web pages and execute multi-step browser tasks autonomously.

**Key Benefits:**
- 89% accuracy on WebVoyager benchmark (vs Skyvern's 64.4%)
- Fully self-hostable via pip install
- Works with Claude 3.5 Sonnet for best results
- Handles complex, multi-page insurance forms

**Related Documentation:**
- [AI Browser Automation Research](../../features/research/ai-browser-automation-tools-2025.md)
- [Epic Q7: Browser Use Agent Integration](../../sprint-artifacts/epics/epic-Q7/epic.md)

## Prerequisites

- **Python 3.11+** - Browser Use requires Python 3.11 or later
- **Anthropic API Key** - Get from [Anthropic Console](https://console.anthropic.com/settings/keys)
- **macOS, Linux, or Windows** - All platforms supported

## Installation

### Step 1: Verify Python Version

```bash
python3 --version
# Should output: Python 3.11.x or higher
```

If Python 3.11+ is not installed:
- **macOS:** `brew install python@3.13`
- **Windows:** Download from [python.org](https://www.python.org/downloads/)
- **Linux:** `apt install python3.11` or `dnf install python3.11`

### Step 2: Install Browser Use

```bash
# Install Browser Use and LangChain Anthropic
pip3 install browser-use langchain-anthropic

# Or use the project's requirements.txt
pip3 install -r requirements.txt
```

### Step 3: Install Playwright Browsers

```bash
# Install Chromium browser binary
playwright install chromium
```

### Step 4: Verify Installation

```bash
python3 -c "from browser_use import Agent; print('Browser Use installed successfully')"
```

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```bash
# Required: Anthropic API Key for Claude
# Get from https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-...

# Browser Use Configuration
BROWSER_USE_MODEL=claude-sonnet-4-5
BROWSER_USE_HEADLESS=false
```

### Model Options

| Model | Speed | Cost | Accuracy | Recommended For |
|-------|-------|------|----------|-----------------|
| claude-sonnet-4-5 | Medium | $$ | Best | Production |
| claude-sonnet-4-0 | Medium | $$ | Good | Alternative |
| claude-haiku-4-5 | Fast | $ | Good | Testing |

## Usage

### Running the POC Script

```bash
# Run with visible browser (watch it work)
python scripts/browser-use-poc.py

# Run in headless mode (production-like)
python scripts/browser-use-poc.py --headless

# Run form fill test
python scripts/browser-use-poc.py --test form

# Run all tests
python scripts/browser-use-poc.py --test all
```

### Basic Example

```python
import asyncio
from browser_use import Agent, ChatAnthropic

async def main():
    # Initialize Claude (Browser Use 0.11+ has built-in ChatAnthropic)
    llm = ChatAnthropic(model="claude-sonnet-4-5", temperature=0.0)

    # Create agent with task
    agent = Agent(
        task="Go to google.com and search for 'insurance quotes'",
        llm=llm,
        headless=False,  # Set True for production
    )

    # Execute
    result = await agent.run()
    print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(main())
```

### Integration Pattern (Future Q7.2)

```python
# This will be implemented in Story Q7.2
class BrowserUseAdapter:
    """Adapter implementing QuoteAgent interface."""

    async def execute_quote(self, params):
        agent = Agent(
            task=self._build_insurance_task(params),
            llm=self.llm,
            headless=True,
        )
        return await agent.run()
```

## Troubleshooting

### Common Issues

#### 1. "ANTHROPIC_API_KEY not set"

**Solution:** Add your API key to `.env.local`:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

#### 2. "playwright install failed"

**Solution:** Run with elevated permissions or install globally:
```bash
# macOS/Linux
sudo playwright install chromium

# Or install to user directory
playwright install chromium --with-deps
```

#### 3. "Browser Use import error"

**Solution:** Reinstall with correct Python:
```bash
pip3 uninstall browser-use
pip3 install browser-use --upgrade
```

#### 4. "Timeout waiting for element"

**Cause:** Page loads slowly or element selector changed.

**Solution:**
- Increase timeout in agent configuration
- Use more specific task descriptions
- Try a different model (Claude works best)

#### 5. "Rate limit exceeded"

**Cause:** Too many API calls to Anthropic.

**Solution:**
- Add delays between operations
- Use caching for repeated tasks
- Upgrade API tier if needed

### Dependency Conflicts

If you see langchain-core version conflicts:
```bash
# This is expected - browser-use requires newer langchain-core
# The conflict with langchain-openai can be ignored if using Claude
pip install browser-use --ignore-installed
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    docuMINE Application                     │
├─────────────────────────────────────────────────────────────┤
│  TypeScript/Next.js │  Python/Browser Use                   │
│  ─────────────────  │  ─────────────────                    │
│  │ QuoteAgent      │  │ browser-use-poc.py                 │
│  │ Interface       │  │                                     │
│  │     │           │  │ ┌─────────────────┐                │
│  │     ▼           │  │ │ Browser Use     │                │
│  │ BrowserUse      │  │ │   Agent         │                │
│  │ Adapter         │◄─┼─│     │           │                │
│  │ (Q7.2)          │  │ │     ▼           │                │
│  └─────────────────┘  │ │ LangChain       │                │
│                       │ │ Anthropic       │                │
│                       │ │     │           │                │
│                       │ │     ▼           │                │
│                       │ │ Playwright      │                │
│                       │ │ (Chromium)      │                │
│                       │ └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## Cost Estimation

| Operation | Model | Est. Tokens | Cost |
|-----------|-------|-------------|------|
| Simple form fill | Claude 3.5 | ~2,000 | ~$0.06 |
| Multi-page quote | Claude 3.5 | ~10,000 | ~$0.30 |
| With recipe cache | Cached | ~500 | ~$0.015 |

**Note:** Recipe caching (Epic Q11) reduces costs by ~80% for repeated operations.

## Security Considerations

1. **API Keys:** Never commit ANTHROPIC_API_KEY to git
2. **Credentials:** Use Supabase Vault for carrier credentials (Epic Q8)
3. **Headless Mode:** Always use headless=true in production
4. **Rate Limiting:** Implement backoff for API errors

## Next Steps

After completing this setup:

1. **Story Q7.2:** Browser Use Adapter - TypeScript wrapper implementing QuoteAgent interface
2. **Story Q7.3:** RAM Mutual Carrier - Test with live credentials
3. **Story Q7.4:** Agent Factory - Routing between Browser Use and Skyvern
4. **Story Q7.5:** A/B Testing - Compare agent performance

## References

- [Browser Use Documentation](https://browser-use.com/)
- [Browser Use GitHub](https://github.com/browser-use/browser-use)
- [LangChain Anthropic](https://python.langchain.com/docs/integrations/chat/anthropic)
- [Playwright Python](https://playwright.dev/python/)
