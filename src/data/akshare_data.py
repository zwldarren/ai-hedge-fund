import pandas as pd
import akshare_one as ao
from datetime import timedelta
from cachetools.func import ttl_cache
from data.models import FinancialMetrics


class AksharePrice:
    def __init__(self, open, close, high, low, volume, time):
        self.open = open
        self.close = close
        self.high = high
        self.low = low
        self.volume = volume
        self.time = time


class AkshareFinancialMetrics:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class AkshareLineItem:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class AkshareInsiderTrade:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class AkshareCompanyNews:
    def __init__(self, **kwargs):
        # Remove sentiment as akshare-one news data doesn't provide it
        if "sentiment" in kwargs:
            del kwargs["sentiment"]
        for key, value in kwargs.items():
            setattr(self, key, value)


class AkshareCompanyFacts:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


@ttl_cache(maxsize=128, ttl=3600)
def get_akshare_hist_data(
    symbol: str,
    start_date: str,
    end_date: str,
    interval: str = "day",
    adjust: str = "qfq",
) -> list[AksharePrice]:
    """
    Fetches historical price data for A-share stocks using akshare-one.
    Transforms the DataFrame output into a list of AksharePrice objects.
    """
    try:
        df = ao.get_hist_data(
            symbol=symbol,
            interval=interval,
            start_date=start_date,
            end_date=end_date,
            adjust=adjust,
            source="eastmoney_direct",
        )
        if df.empty:
            return []

        prices = []
        for _, row in df.iterrows():
            prices.append(
                AksharePrice(
                    open=row["open"],
                    close=row["close"],
                    high=row["high"],
                    low=row["low"],
                    volume=row["volume"],
                    time=row["timestamp"].isoformat(),
                )
            )
        return prices
    except Exception as e:
        print(f"Error fetching historical data for {symbol}: {e}")
        return []


@ttl_cache(maxsize=128, ttl=300)
def get_akshare_realtime_data(symbol: str) -> dict:
    """
    Fetches real-time price data for A-share stocks using akshare-one.
    Returns a dictionary of the latest data.
    """
    try:
        df = ao.get_realtime_data(symbol=symbol, source="eastmoney_direct")
        if df.empty:
            return {}
        return df.iloc[0].to_dict()
    except Exception as e:
        print(f"Error fetching real-time data for {symbol}: {e}")
        return {}


@ttl_cache(maxsize=128, ttl=3600)
def get_akshare_financial_statements(
    symbol: str, statement_type: str, limit: int = 1
) -> list[AkshareFinancialMetrics]:
    """
    Fetches financial statements (balance sheet, income statement, cash flow) for A-share stocks.
    statement_type can be 'balance_sheet', 'income_statement', 'cash_flow'.
    """
    df = pd.DataFrame()
    try:
        if statement_type == "balance_sheet":
            df = ao.get_balance_sheet(symbol=symbol)
        elif statement_type == "income_statement":
            df = ao.get_income_statement(symbol=symbol)
        elif statement_type == "cash_flow":
            df = ao.get_cash_flow(symbol=symbol)
        else:
            print(f"Invalid statement_type: {statement_type}")
            return []

        if df.empty:
            return []

        # Sort by report_date descending to get most recent first
        df["report_date"] = pd.to_datetime(df["report_date"])
        df = df.sort_values(by="report_date", ascending=False)

        metrics_list = []
        for _, row in df.head(limit).iterrows():
            metrics_list.append(AkshareFinancialMetrics(**row.to_dict()))
        return metrics_list
    except Exception as e:
        print(f"Error fetching {statement_type} for {symbol}: {e}")
        return []


@ttl_cache(maxsize=128, ttl=3600)
def get_akshare_news_data(
    symbol: str,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = 100,
) -> list[AkshareCompanyNews]:
    """
    Fetches company news for A-share stocks using akshare-one.
    """
    try:
        df = ao.get_news_data(symbol=symbol)
        if df.empty:
            return []

        # Filter by date if start_date and end_date are provided
        df["publish_time"] = pd.to_datetime(df["publish_time"], utc=True)
        if start_date:
            df = df[df["publish_time"] >= pd.to_datetime(start_date, utc=True)]
        if end_date:
            df = df[
                df["publish_time"]
                <= pd.to_datetime(end_date, utc=True) + timedelta(days=1)
            ]  # Include end_date

        news_list = []
        for _, row in df.head(limit).iterrows():
            news_list.append(
                AkshareCompanyNews(
                    ticker=symbol,
                    title=row["title"],
                    author="N/A",
                    source=row["source"],
                    date=row["publish_time"].isoformat(),
                    url=row["url"],
                    sentiment="neutral",  # There is no sentiment analysis
                )
            )
        return news_list
    except Exception as e:
        print(f"Error fetching news data for {symbol}: {e}")
        return []


@ttl_cache(maxsize=128, ttl=3600)
def get_akshare_insider_trades(
    symbol: str,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = 100,
) -> list[AkshareInsiderTrade]:
    """
    Fetches insider trading data for A-share stocks using akshare-one.
    """
    try:
        df = ao.get_inner_trade_data(symbol=symbol)
        if df.empty:
            return []

        # Filter by date if start_date and end_date are provided
        df["transaction_date"] = pd.to_datetime(df["transaction_date"], utc=True)
        if start_date:
            df = df[df["transaction_date"] >= pd.to_datetime(start_date, utc=True)]
        if end_date:
            df = df[
                df["transaction_date"]
                <= pd.to_datetime(end_date, utc=True) + timedelta(days=1)
            ]  # Include end_date

        trades_list = []
        for _, row in df.head(limit).iterrows():
            trades_list.append(
                AkshareInsiderTrade(
                    ticker=symbol,
                    issuer=row.get("issuer"),
                    name=row.get("name"),
                    title=row.get("title"),
                    is_board_director=row.get("is_board_director"),
                    transaction_date=row["transaction_date"].isoformat(),
                    transaction_shares=row.get("transaction_shares"),
                    transaction_price_per_share=row.get("transaction_price_per_share"),
                    transaction_value=row.get("transaction_value"),
                    shares_owned_before_transaction=row.get(
                        "shares_owned_before_transaction"
                    ),
                    shares_owned_after_transaction=row.get(
                        "shares_owned_after_transaction"
                    ),
                    security_title="N/A",
                    filing_date=row[
                        "transaction_date"
                    ].isoformat(),  # Using transaction_date as filing_date
                )
            )
        return trades_list
    except Exception as e:
        print(f"Error fetching insider trades for {symbol}: {e}")
        return []


def get_akshare_market_cap(symbol: str, date: str) -> float | None:
    """
    Gets market capitalization for A-share stocks using akshare-one's get_basic_info API.
    """
    try:
        info = ao.get_basic_info(symbol=symbol)
        if not info.empty and "total_market_cap" in info:
            return info["total_market_cap"].iloc[0]
        print(f"Market cap not found for {symbol} via get_basic_info API")
        return None
    except Exception as e:
        print(f"Error getting market cap for {symbol}: {e}")
        return None


@ttl_cache(maxsize=128, ttl=3600)
def get_akshare_company_info(symbol: str) -> dict:
    """
    Gets basic company information using akshare-one's get_basic_info API.
    Returns a dictionary with company details like name, industry, market cap etc.
    """
    try:
        info = ao.get_basic_info(symbol=symbol)
        if info.empty:
            return {}
        return info.iloc[0].to_dict()
    except Exception as e:
        print(f"Error getting company info for {symbol}: {e}")
        return {}


def get_financial_metrics(symbol) -> pd.DataFrame:
    # Define FinancialMetrics model structure from the Pydantic model
    financial_metrics_columns = list(FinancialMetrics.model_fields.keys())

    # Get all financial statements
    balance = ao.get_balance_sheet(symbol)
    income = ao.get_income_statement(symbol)
    cash = ao.get_cash_flow(symbol)

    # If any of the financial statements are missing, we cannot proceed.
    if balance.empty or income.empty or cash.empty:
        return pd.DataFrame(columns=financial_metrics_columns)

    # Merge all statements on report_date
    merged = pd.merge(balance, income, on="report_date", suffixes=("", "_y"))
    merged = pd.merge(merged, cash, on="report_date", suffixes=("", "_z"))

    # If merged is empty after join, return empty df
    if merged.empty:
        return pd.DataFrame(columns=financial_metrics_columns)
        
    # Ensure all required columns exist in merged DataFrame
    required_columns = [
        'revenue', 'cost_of_revenue', 'operating_profit', 'net_income',
        'shareholders_equity', 'total_assets', 'current_assets',
        'current_liabilities', 'cash_and_equivalents', 'current_investments',
        'total_debt', 'interest_expense', 'inventory',
        'trade_and_non_trade_receivables', 'outstanding_shares',
        'net_cash_flow_from_operations'
    ]
    
    for col in required_columns:
        if col not in merged:
            merged[col] = float('nan')

    # Get market data
    try:
        info_df = ao.get_basic_info(symbol)
        market_cap = info_df["total_market_cap"].iloc[0]
        price = info_df["price"].iloc[0]
    except Exception:
        market_cap = None
        price = None

    # Initialize metrics DataFrame
    metrics = pd.DataFrame(
        {
            "ticker": symbol,
            "report_period": pd.to_datetime(merged["report_date"]).dt.strftime(
                "%Y-%m-%d"
            ),
            "currency": merged["currency"],
        }
    )

    # Profitability ratios
    metrics["gross_margin"] = (merged["revenue"] - merged["cost_of_revenue"]) / merged[
        "revenue"
    ]
    metrics["operating_margin"] = merged["operating_profit"] / merged["revenue"]
    metrics["net_margin"] = merged["net_income"] / merged["revenue"]
    metrics["return_on_equity"] = merged["net_income"] / merged["shareholders_equity"]
    metrics["return_on_assets"] = merged["net_income"] / merged["total_assets"]

    # Liquidity ratios
    metrics["current_ratio"] = merged["current_assets"] / merged["current_liabilities"]
    metrics["quick_ratio"] = (
        merged["cash_and_equivalents"] + merged["current_investments"]
    ) / merged["current_liabilities"]
    metrics["cash_ratio"] = (
        merged["cash_and_equivalents"] / merged["current_liabilities"]
    )
    metrics["operating_cash_flow_ratio"] = (
        merged["net_cash_flow_from_operations"] / merged["current_liabilities"]
    )

    # Solvency ratios
    metrics["debt_to_equity"] = merged["total_debt"] / merged["shareholders_equity"]
    metrics["debt_to_assets"] = merged["total_debt"] / merged["total_assets"]
    metrics["interest_coverage"] = merged["ebit"] / merged["interest_expense"]

    # Efficiency ratios
    metrics["asset_turnover"] = merged["revenue"] / merged["total_assets"]
    metrics["inventory_turnover"] = merged["cost_of_revenue"] / merged["inventory"]
    metrics["receivables_turnover"] = (
        merged["revenue"] / merged["trade_and_non_trade_receivables"]
    )
    metrics["days_sales_outstanding"] = 365 / metrics["receivables_turnover"]
    metrics["working_capital_turnover"] = merged["revenue"] / (
        merged["current_assets"] - merged["current_liabilities"]
    )

    # Growth ratios
    metrics["revenue_growth"] = merged["revenue"].pct_change(fill_method=None)
    metrics["earnings_growth"] = merged["net_income"].pct_change(fill_method=None)
    metrics["book_value_growth"] = merged["shareholders_equity"].pct_change(
        fill_method=None
    )
    metrics["earnings_per_share_growth"] = merged["earnings_per_share"].pct_change(
        fill_method=None
    )
    metrics["operating_income_growth"] = merged["operating_profit"].pct_change(
        fill_method=None
    )

    # Free cash flow calculation
    if (
        "capital_expenditure" in merged.columns
        and not merged["capital_expenditure"].isnull().all()
    ):
        free_cash_flow = (
            merged["net_cash_flow_from_operations"] - merged["capital_expenditure"]
        )
        metrics["free_cash_flow_growth"] = free_cash_flow.pct_change(fill_method=None)
        metrics["free_cash_flow_per_share"] = (
            free_cash_flow / merged["outstanding_shares"]
        )
    else:
        free_cash_flow = None
        metrics["free_cash_flow_growth"] = None
        metrics["free_cash_flow_per_share"] = None

    # Calculate ROIC
    invested_capital = merged["total_assets"] - merged["current_liabilities"]
    metrics["return_on_invested_capital"] = merged["net_income"] / invested_capital

    # Calculate Operating Cycle
    days_inventory_outstanding = 365 / metrics["inventory_turnover"]
    metrics["operating_cycle"] = (
        metrics["days_sales_outstanding"] + days_inventory_outstanding
    )

    # Per share metrics
    metrics["earnings_per_share"] = merged["earnings_per_share"]
    metrics["book_value_per_share"] = (
        merged["shareholders_equity"] / merged["outstanding_shares"]
    )

    # Calculate EBITDA and EBITDA Growth
    merged["ebitda"] = None
    metrics["ebitda_growth"] = None

    # Market-based metrics
    metrics["market_cap"] = market_cap
    metrics["enterprise_value"] = None
    metrics["price_to_earnings_ratio"] = None
    metrics["price_to_book_ratio"] = None
    metrics["price_to_sales_ratio"] = None
    metrics["enterprise_value_to_ebitda_ratio"] = None
    metrics["enterprise_value_to_revenue_ratio"] = None
    metrics["free_cash_flow_yield"] = None
    metrics["peg_ratio"] = None

    if market_cap is not None:
        enterprise_value = (
            market_cap + merged["total_debt"] - merged["cash_and_equivalents"]
        )
        metrics["enterprise_value"] = enterprise_value
        metrics["price_to_sales_ratio"] = market_cap / merged["revenue"]
        metrics["enterprise_value_to_revenue_ratio"] = (
            enterprise_value / merged["revenue"]
        )

        if free_cash_flow is not None:
            metrics["free_cash_flow_yield"] = free_cash_flow / market_cap

        if price is not None:
            metrics["price_to_earnings_ratio"] = price / metrics["earnings_per_share"]
            metrics["price_to_book_ratio"] = price / metrics["book_value_per_share"]

        if (
            not metrics["price_to_earnings_ratio"].isnull().all()
            and not metrics["earnings_growth"].isnull().all()
        ):
            metrics["peg_ratio"] = metrics["price_to_earnings_ratio"] / (
                metrics["earnings_growth"] * 100
            )

        if "ebitda" in merged and not merged["ebitda"].isnull().all():
            metrics["enterprise_value_to_ebitda_ratio"] = (
                enterprise_value / merged["ebitda"]
            )

    # Payout ratio (requires dividend data, not available yet)
    metrics["payout_ratio"] = None

    # Reorder and fill N/A
    return metrics.reindex(columns=financial_metrics_columns)
