# AI Hedge Fund

This is a proof of concept for an AI-powered hedge fund.  The goal of this project is to explore the use of AI to make trading decisions.  This project is for **educational** purposes only and is not intended for real trading or investment.

<div align="center">

**English** · [简体中文](./README_CN.md)

</div>

This system employs several agents working together:

1. Ben Graham Agent - The godfather of value investing, only buys hidden gems with a margin of safety
2. Bill Ackman Agent - An activist investors, takes bold positions and pushes for change
3. Cathie Wood Agent - The queen of growth investing, believes in the power of innovation and disruption
4. Charlie Munger Agent - Warren Buffett's partner, only buys wonderful businesses at fair prices
5. Phil Fisher Agent - Legendary growth investor who mastered scuttlebutt analysis
6. Stanley Druckenmiller Agent - Macro legend who hunts for asymmetric opportunities with growth potential
7. Warren Buffett Agent - The oracle of Omaha, seeks wonderful companies at a fair price
8. Valuation Agent - Calculates the intrinsic value of a stock and generates trading signals
9. Sentiment Agent - Analyzes market sentiment and generates trading signals
10. Fundamentals Agent - Analyzes fundamental data and generates trading signals
11. Technicals Agent - Analyzes technical indicators and generates trading signals
12. Risk Manager - Calculates risk metrics and sets position limits
13. Portfolio Manager - Makes final trading decisions and generates orders
    
<img width="1042" alt="Screenshot 2025-03-22 at 6 19 07 PM" src="https://github.com/user-attachments/assets/cbae3dcf-b571-490d-b0ad-3f0f035ac0d4" />


**Note**: the system simulates trading decisions, it does not actually trade.

[![Twitter Follow](https://img.shields.io/twitter/follow/virattt?style=social)](https://twitter.com/virattt)

## Disclaimer

This project is for **educational and research purposes only**.

- Not intended for real trading or investment
- No warranties or guarantees provided
- Past performance does not indicate future results
- Creator assumes no liability for financial losses
- Consult a financial advisor for investment decisions

By using this software, you agree to use it solely for learning purposes.

## Table of Contents
- [Setup](#setup)
- [Usage](#usage)
  - [Running the Hedge Fund](#running-the-hedge-fund)
  - [Running the Backtester](#running-the-backtester)
  - [Custom Models](#custom-models)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Feature Requests](#feature-requests)
- [License](#license)

## Setup

Clone the repository:
```bash
git clone https://github.com/zwldarren/ai-hedge-fund.git
cd ai-hedge-fund
```

1. Install UV (if not already installed):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. Install dependencies:
```bash
uv sync
```

3. Set up your environment variables:
```bash
# Create .env file for your API keys
cp .env.example .env
```

4. (Optional) Edit models.yaml to configure custom models (see [Custom Models](#custom-models) section)

5. Set your API keys:
```bash
# For running LLMs hosted by openai (gpt-4o, gpt-4o-mini, etc.)
# Get your OpenAI API key from https://platform.openai.com/
OPENAI_API_KEY=your-openai-api-key
OPENAI_API_BASE=https://api.openai.com/v1

# For running LLMs hosted by groq (deepseek, llama3, etc.)
# Get your Groq API key from https://groq.com/
GROQ_API_KEY=your-groq-api-key

# For getting financial data to power the hedge fund
# Get your Financial Datasets API key from https://financialdatasets.ai/
FINANCIAL_DATASETS_API_KEY=your-financial-datasets-api-key
```

**Important**: You must set `OPENAI_API_KEY`, `GROQ_API_KEY`, `ANTHROPIC_API_KEY`, or `DEEPSEEK_API_KEY` for the hedge fund to work.  If you want to use LLMs from all providers, you will need to set all API keys.

Financial data for AAPL, GOOGL, MSFT, NVDA, and TSLA is free and does not require an API key.

For any other ticker, you will need to set the `FINANCIAL_DATASETS_API_KEY` in the .env file.

## Usage

### Running the Hedge Fund
```bash
uv run src/main.py --ticker AAPL,MSFT,NVDA
```

**Example Output:**
<img width="992" alt="Screenshot 2025-01-06 at 5 50 17 PM" src="https://github.com/user-attachments/assets/e8ca04bf-9989-4a7d-a8b4-34e04666663b" />

You can also specify a `--show-reasoning` flag to print the reasoning of each agent to the console.

```bash
uv run src/main.py --ticker AAPL,MSFT,NVDA --show-reasoning
```

You can also specify a custom models configuration file:
```bash
uv run src/main.py --ticker AAPL,MSFT,NVDA --models-config models.yaml
```
You can optionally specify the start and end dates to make decisions for a specific time period.

```bash
uv run src/main.py --ticker AAPL,MSFT,NVDA --start-date 2024-01-01 --end-date 2024-03-01 
```

### Running the Backtester

```bash
uv run src/backtester.py --ticker AAPL,MSFT,NVDA
```

**Example Output:**
<img width="941" alt="Screenshot 2025-01-06 at 5 47 52 PM" src="https://github.com/user-attachments/assets/00e794ea-8628-44e6-9a84-8f8a31ad3b47" />

You can optionally specify the start and end dates to backtest over a specific time period.

```bash
uv run src/backtester.py --ticker AAPL,MSFT,NVDA --start-date 2024-01-01 --end-date 2024-03-01
```

### Custom Models

You can customize the LLM models used by the hedge fund by editing the `models.yaml` file. The system supports models from the following providers:

- Anthropic (claude-3.5-haiku, claude-3.5-sonnet, claude-3.7-sonnet)
- Deepseek (deepseek-v3, deepseek-r1)
- Gemini (gemini-2.0-flash, gemini-2.0-pro)
- Groq (llama-3.3-70b)
- OpenAI (gpt-4.5, gpt-4o, o1, o3-mini)

To configure custom models:

1. Edit the `models.yaml` file following the existing format
2. Each model entry should include:
   - `model_name`: The provider's model identifier
   - `display_name`: Human-readable name (shown in UI)
   - `provider`: Lowercase provider name (anthropic, deepseek, gemini, groq, openai)

Example configuration:
```yaml
models:
  - model_name: "claude-3-5-sonnet-latest"
    display_name: "[anthropic] claude-3.5-sonnet"
    provider: "anthropic"
  
  - model_name: "gpt-4o"
    display_name: "[openai] gpt-4o" 
    provider: "openai"
```

Then run the hedge fund with your custom models file:
```bash
uv run src/main.py --ticker AAPL,MSFT,NVDA --models-config models.yaml
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

**Important**: Please keep your pull requests small and focused.  This will make it easier to review and merge.

## Feature Requests

If you have a feature request, please open an [issue](https://github.com/virattt/ai-hedge-fund/issues) and make sure it is tagged with `enhancement`.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
