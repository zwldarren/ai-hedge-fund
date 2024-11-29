# AI Hedge Fund

An AI-powered hedge fund that uses multiple agents to make trading decisions. The system employs several specialized agents working together:

1. Market Data Agent - Gathers and preprocesses market data
2. Quantitative Agent - Analyzes technical indicators and generates trading signals
3. Risk Management Agent - Evaluates portfolio risk and sets position limits
4. Portfolio Management Agent - Makes final trading decisions and generates orders

## Features

- Multi-agent architecture for sophisticated trading decisions
- Technical analysis using MACD, RSI, Bollinger Bands, and OBV
- Risk management with position sizing recommendations
- Portfolio management with automated trading decisions
- Backtesting capabilities with performance analytics
- Support for multiple stock tickers

## Prerequisites

- Python 3.9+
- Poetry
- OpenAI API key

## Setup

Clone the repository:
```bash
git clone https://github.com/your-repo/ai-hedge-fund.git
cd ai-hedge-fund
```

### Using Poetry

1. Install Poetry (if not already installed):
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

2. Install dependencies:
```bash
poetry install
```

3. Set up your environment variables:
```bash
cp .env.example .env
export OPENAI_API_KEY='your-api-key-here'
export FINANCIAL_DATASETS_API_KEY='your-api-key-here'
```

## Usage

### Running the Hedge Fund

```bash
poetry run python agents.py --ticker AAPL --start-date 2024-01-01 --end-date 2024-03-01
```

**Example Output:**
```json
{
  "action": "buy",
  "quantity": 50000,
  "ticker": "AAPL"
}
```

### Running the Backtester

```bash
poetry run python backtester.py --ticker AAPL --start-date 2024-01-01 --end-date 2024-03-01
```

## Project Structure 
ai-hedge-fund/
├── agents.py # Main agent definitions and workflow
├── backtester.py # Backtesting functionality
├── tools.py # Technical analysis tools
├── requirements.txt # Python dependencies
├── pyproject.toml # Poetry configuration
└── README.md # Documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
