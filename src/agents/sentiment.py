from langchain_core.messages import HumanMessage
from graph.state import AgentState, show_agent_reasoning
from utils.progress import progress
import pandas as pd
import numpy as np
import json

from tools.api import get_insider_trades, get_company_news


##### Sentiment Agent #####
def sentiment_analyst_agent(state: AgentState):
    """Analyzes market sentiment and generates trading signals for multiple tickers."""
    data = state.get("data", {})
    end_date = data.get("end_date")
    tickers = data.get("tickers")

    # Initialize sentiment analysis for each ticker
    sentiment_analysis = {}

    for ticker in tickers:
        progress.update_status(
            "sentiment_analyst_agent", ticker, "Fetching insider trades"
        )

        # Get the insider trades
        insider_trades = get_insider_trades(
            ticker=ticker,
            end_date=end_date,
            limit=1000,
        )

        progress.update_status(
            "sentiment_analyst_agent", ticker, "Analyzing trading patterns"
        )

        # Get the signals from the insider trades
        transaction_shares = pd.Series(
            [t.transaction_shares for t in insider_trades]
        ).dropna()
        insider_signals = np.where(
            transaction_shares < 0, "bearish", "bullish"
        ).tolist()

        progress.update_status(
            "sentiment_analyst_agent", ticker, "Fetching company news"
        )

        # Get the company news
        company_news = get_company_news(ticker, end_date, limit=100)

        # Get the sentiment from the company news
        # Akshare-one news data does not provide sentiment, so default to "neutral"
        sentiment = pd.Series(
            [
                n.sentiment
                if hasattr(n, "sentiment") and n.sentiment is not None
                else "neutral"
                for n in company_news
            ]
        )
        news_signals = np.where(
            sentiment == "negative",
            "bearish",
            np.where(sentiment == "positive", "bullish", "neutral"),
        ).tolist()

        progress.update_status("sentiment_analyst_agent", ticker, "Combining signals")
        # Combine signals from both sources with weights
        insider_weight = 0.3
        news_weight = 0.7

        # Calculate weighted signal counts
        bullish_signals = (
            insider_signals.count("bullish") * insider_weight
            + news_signals.count("bullish") * news_weight
        )
        bearish_signals = (
            insider_signals.count("bearish") * insider_weight
            + news_signals.count("bearish") * news_weight
        )

        if bullish_signals > bearish_signals:
            overall_signal = "bullish"
        elif bearish_signals > bullish_signals:
            overall_signal = "bearish"
        else:
            overall_signal = "neutral"

        # Calculate confidence level based on the weighted proportion
        total_weighted_signals = (
            len(insider_signals) * insider_weight + len(news_signals) * news_weight
        )
        confidence = 0  # Default confidence when there are no signals
        if total_weighted_signals > 0:
            confidence = round(
                (max(bullish_signals, bearish_signals) / total_weighted_signals) * 100,
                2,
            )

        # Create structured reasoning similar to technical analysis
        reasoning = {
            "insider_trading": {
                "signal": "bullish"
                if insider_signals.count("bullish") > insider_signals.count("bearish")
                else "bearish"
                if insider_signals.count("bearish") > insider_signals.count("bullish")
                else "neutral",
                "confidence": round(
                    (
                        max(
                            insider_signals.count("bullish"),
                            insider_signals.count("bearish"),
                        )
                        / max(len(insider_signals), 1)
                    )
                    * 100
                ),
                "metrics": {
                    "total_trades": len(insider_signals),
                    "bullish_trades": insider_signals.count("bullish"),
                    "bearish_trades": insider_signals.count("bearish"),
                    "weight": insider_weight,
                    "weighted_bullish": round(
                        insider_signals.count("bullish") * insider_weight, 1
                    ),
                    "weighted_bearish": round(
                        insider_signals.count("bearish") * insider_weight, 1
                    ),
                },
            },
            "news_sentiment": {
                "signal": "bullish"
                if news_signals.count("bullish") > news_signals.count("bearish")
                else "bearish"
                if news_signals.count("bearish") > news_signals.count("bullish")
                else "neutral",
                "confidence": round(
                    (
                        max(
                            news_signals.count("bullish"), news_signals.count("bearish")
                        )
                        / max(len(news_signals), 1)
                    )
                    * 100
                ),
                "metrics": {
                    "total_articles": len(news_signals),
                    "bullish_articles": news_signals.count("bullish"),
                    "bearish_articles": news_signals.count("bearish"),
                    "neutral_articles": news_signals.count("neutral"),
                    "weight": news_weight,
                    "weighted_bullish": round(
                        news_signals.count("bullish") * news_weight, 1
                    ),
                    "weighted_bearish": round(
                        news_signals.count("bearish") * news_weight, 1
                    ),
                },
            },
            "combined_analysis": {
                "total_weighted_bullish": round(bullish_signals, 1),
                "total_weighted_bearish": round(bearish_signals, 1),
                "signal_determination": f"{'Bullish' if bullish_signals > bearish_signals else 'Bearish' if bearish_signals > bullish_signals else 'Neutral'} based on weighted signal comparison",
            },
        }

        sentiment_analysis[ticker] = {
            "signal": overall_signal,
            "confidence": confidence,
            "reasoning": reasoning,
        }

        progress.update_status(
            "sentiment_analyst_agent",
            ticker,
            "Done",
            analysis=json.dumps(reasoning, indent=4),
        )

    # Create the sentiment message
    message = HumanMessage(
        content=json.dumps(sentiment_analysis),
        name="sentiment_analyst_agent",
    )

    # Print the reasoning if the flag is set
    if state["metadata"]["show_reasoning"]:
        show_agent_reasoning(sentiment_analysis, "Sentiment Analysis Agent")

    # Add the signal to the analyst_signals list
    state["data"]["analyst_signals"]["sentiment_agent"] = sentiment_analysis

    progress.update_status("sentiment_analyst_agent", None, "Done")

    return {
        "messages": [message],
        "data": data,
    }
