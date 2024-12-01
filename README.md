# AI Hedge Fund

An AI-powered hedge fund that uses multiple agents to make trading decisions. The system employs several specialized agents working together:

1. Market Data Agent - Gathers and preprocesses market data
2. Quantitative Agent - Analyzes technical indicators and generates trading signals
3. Risk Management Agent - Evaluates portfolio risk and sets position limits
4. Portfolio Management Agent - Makes final trading decisions and generates orders

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [Using Poetry](#using-poetry)
- [Usage](#usage)
  - [Running the Hedge Fund](#running-the-hedge-fund)
  - [Running the Hedge Fund (with Decisions)](#running-the-hedge-fund-with-decisions)
  - [Running the Backtester](#running-the-backtester)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

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
poetry run python src/agents.py --ticker AAPL
```

**Example Output:**
```json
{
  "action": "buy",
  "quantity": 50000,
}
```

You can optionally specify the start and end dates to make decisions for a specific time period.

```bash
poetry run python src/agents.py --ticker AAPL --start-date 2024-01-01 --end-date 2024-03-01
```

### Running the Hedge Fund (with Decisions)
This will print the decisions of each agent to the console.

```bash
poetry run python src/agents.py --ticker AAPL --show-decisions
```

**Example Output:**
```
=====         Quant Agent          =====
Quant Trading Signal: neutral 
Confidence (0-1, higher is better): 0.25
========================================

=====    Risk Management Agent     =====
Max Position Size: 5000.0  
Risk Score: 4
========================================

=====  Portfolio Management Agent  =====
{
  "action": "buy",
  "quantity": 5000
}
========================================
```

### Running the Backtester

```bash
poetry run python src/backtester.py --ticker AAPL
```

**Example Output:**
```
Starting backtest...
Date         Ticker Action Quantity    Price         Cash    Stock  Total Value
----------------------------------------------------------------------
2024-01-01   AAPL   buy       519.0   192.53        76.93    519.0    100000.00
2024-01-02   AAPL   hold          0   185.64        76.93    519.0     96424.09
2024-01-03   AAPL   hold          0   184.25        76.93    519.0     95702.68
2024-01-04   AAPL   hold          0   181.91        76.93    519.0     94488.22
2024-01-05   AAPL   hold          0   181.18        76.93    519.0     94109.35
2024-01-08   AAPL   sell        519   185.56     96382.57      0.0     96382.57
2024-01-09   AAPL   buy       520.0   185.14       109.77    520.0     96382.57
```

You can optionally specify the start and end dates to backtest over a specific time period.

```bash
poetry run python src/backtester.py --ticker AAPL --start-date 2024-01-01 --end-date 2024-03-01
```

## Project Structure 
```
ai-hedge-fund/
├── src/
│   ├── agents.py # Main agent definitions and workflow
│   ├── backtester.py # Backtesting functionality
│   ├── tools.py # Technical analysis tools
├── pyproject.toml # Poetry configuration
├── .env.example # Environment variables
└── README.md # Documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
