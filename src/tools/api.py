import pandas as pd

from data.cache import get_cache
from data.models import (
    CompanyNews,
    FinancialMetrics,
    Price,
    LineItem,
    InsiderTrade,
)
from data.akshare_data import (
    get_akshare_hist_data,
    get_akshare_financial_statements,
    get_akshare_news_data,
    get_akshare_insider_trades,
    get_akshare_market_cap,
    get_akshare_company_info,
    get_financial_metrics as akshare_get_financial_metrics,
)

# Global cache instance
_cache = get_cache()
# Module-level price cache for full datasets
_full_price_cache = {}


def get_prices(ticker: str, start_date: str, end_date: str) -> list[Price]:
    """Fetch price data from cache or akshare-one with static caching."""
    cache_key = f"prices_{ticker}"
    
    # Check if we have full dataset cached
    if cache_key in _full_price_cache:
        all_prices = _full_price_cache[cache_key]
    else:
        # Fetch full dataset (use wide date range)
        akshare_prices = get_akshare_hist_data(ticker, "2000-01-01", "2030-12-31")
        all_prices = [
            Price(
                open=p.open,
                close=p.close,
                high=p.high,
                low=p.low,
                volume=p.volume,
                time=p.time,
            )
            for p in akshare_prices
        ]
        _full_price_cache[cache_key] = all_prices
    
    # Filter by requested date range
    filtered_prices = [
        p for p in all_prices 
        if start_date <= p.time.split("T")[0] <= end_date
    ]
    
    return filtered_prices


def get_financial_metrics(
    ticker: str,
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> list[FinancialMetrics]:
    """Fetch financial metrics from cache or akshare-one, now using the consolidated data source."""
    cache_key = f"financial_metrics_{ticker}_{period}_{end_date}_{limit}"
    if cached_data := _cache.get_financial_metrics(cache_key):
        return [FinancialMetrics(**metric) for metric in cached_data]

    # Use the new consolidated function from akshare_data
    metrics_df = akshare_get_financial_metrics(ticker)

    if metrics_df.empty:
        return []

    # Apply limit
    metrics_df = metrics_df.head(limit)

    combined_metrics = []
    for _, row in metrics_df.iterrows():
        row_dict = row.to_dict()

        # Replace numpy NaN with None for Pydantic model compatibility
        cleaned_row = {k: (None if pd.isna(v) else v) for k, v in row_dict.items()}

        # Add the 'period' field required by the model
        cleaned_row["period"] = period

        try:
            # Filter dict to only include keys that are in the FinancialMetrics model
            valid_keys = FinancialMetrics.model_fields.keys()
            filtered_row = {k: v for k, v in cleaned_row.items() if k in valid_keys}
            metrics = FinancialMetrics(**filtered_row)
            combined_metrics.append(metrics)
        except Exception as e:
            print(
                f"Could not create FinancialMetrics for row: {cleaned_row}. Error: {e}"
            )
            continue

    if not combined_metrics:
        return []

    _cache.set_financial_metrics(cache_key, [m.model_dump() for m in combined_metrics])
    return combined_metrics


def search_line_items(
    ticker: str,
    line_items: list[str],
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> list[LineItem]:
    """Fetch line items from akshare-one."""
    high_limit = 100
    balance_sheets = get_akshare_financial_statements(
        ticker, "balance_sheet", limit=high_limit
    )
    income_statements = get_akshare_financial_statements(
        ticker, "income_statement", limit=high_limit
    )
    cash_flows = get_akshare_financial_statements(ticker, "cash_flow", limit=high_limit)

    all_statements = []
    for bs in balance_sheets:
        all_statements.append(
            {
                "report_date": bs.report_date,
                "period": "annual",
                "currency": bs.currency,
                **bs.__dict__,
            }
        )
    for inc in income_statements:
        all_statements.append(
            {
                "report_date": inc.report_date,
                "period": "annual",
                "currency": inc.currency,
                **inc.__dict__,
            }
        )
    for cf in cash_flows:
        all_statements.append(
            {
                "report_date": cf.report_date,
                "period": "annual",
                "currency": cf.currency,
                **cf.__dict__,
            }
        )

    # Convert end_date to Timestamp for comparison
    end_date_dt = pd.to_datetime(end_date)
    # Filter statements by report_date <= end_date_dt
    all_statements = [stmt for stmt in all_statements if stmt["report_date"] <= end_date_dt]

    # If no statements after filtering, return empty list
    if not all_statements:
        return []

    # Group by report_period (string of the report_date's date)
    grouped = {}
    for stmt in all_statements:
        # Create a string key for the report date (YYYY-MM-DD)
        report_period_str = stmt["report_date"].strftime("%Y-%m-%d")
        if report_period_str not in grouped:
            base_info = {
                "ticker": ticker,
                "report_period": report_period_str,
                "period": stmt["period"],  # "annual"
                "currency": stmt["currency"],
            }
            line_items_found = {}
            grouped[report_period_str] = (base_info, line_items_found)
        else:
            base_info, line_items_found = grouped[report_period_str]

        # For each requested line item, if it exists in the statement, add it to line_items_found
        for item in line_items:
            if item in stmt:
                line_items_found[item] = stmt[item]

    # create a LineItem for each group
    found_line_items = []
    for report_period_str, (base_info, line_items_found) in grouped.items():
        if line_items_found:
            data = {**base_info, **line_items_found}
            found_line_items.append(LineItem(**data))

    # Sort by report_period descending (most recent first)
    found_line_items.sort(key=lambda x: x.report_period, reverse=True)

    return found_line_items[:limit]


def get_insider_trades(
    ticker: str,
    end_date: str,
    start_date: str | None = None,
    limit: int = 1000,
) -> list[InsiderTrade]:
    """Fetch insider trades from cache or akshare-one."""
    cache_key = f"insider_trades_{ticker}_{start_date or 'none'}_{end_date}_{limit}"
    if cached_data := _cache.get_insider_trades(cache_key):
        return [InsiderTrade(**trade) for trade in cached_data]

    akshare_trades = get_akshare_insider_trades(ticker, start_date, end_date, limit)
    trades = [
        InsiderTrade(
            ticker=t.ticker,
            issuer=t.issuer,
            name=t.name,
            title=t.title,
            is_board_director=t.is_board_director,
            transaction_date=t.transaction_date,
            transaction_shares=t.transaction_shares,
            transaction_price_per_share=t.transaction_price_per_share,
            transaction_value=t.transaction_value,
            shares_owned_before_transaction=t.shares_owned_before_transaction,
            shares_owned_after_transaction=t.shares_owned_after_transaction,
            security_title=t.security_title,
            filing_date=t.filing_date,
        )
        for t in akshare_trades
    ]

    if not trades:
        return []

    _cache.set_insider_trades(cache_key, [t.model_dump() for t in trades])
    return trades


def get_company_news(
    ticker: str,
    end_date: str,
    start_date: str | None = None,
    limit: int = 1000,
) -> list[CompanyNews]:
    """Fetch company news from cache or akshare-one."""
    cache_key = f"company_news_{ticker}_{start_date or 'none'}_{end_date}_{limit}"
    if cached_data := _cache.get_company_news(cache_key):
        return [CompanyNews(**news) for news in cached_data]

    akshare_news = get_akshare_news_data(ticker, start_date, end_date, limit)
    news = [
        CompanyNews(
            ticker=n.ticker,
            title=n.title,
            author=n.author,
            source=n.source,
            date=n.date,
            url=n.url,
            sentiment=getattr(n, "sentiment", "neutral"),
        )
        for n in akshare_news
    ]

    if not news:
        return []

    _cache.set_company_news(cache_key, [n.model_dump() for n in news])
    return news


def get_market_cap(
    ticker: str,
    end_date: str,
) -> float | None:
    """Fetch market cap from akshare-one."""
    return get_akshare_market_cap(ticker, end_date)


def get_company_info(ticker: str) -> dict:
    """Fetch basic company information from akshare-one."""
    cache_key = f"company_info_{ticker}"
    if cached_data := _cache.get_company_info(cache_key):
        return cached_data

    info = get_akshare_company_info(ticker)
    if not info:
        return {}

    _cache.set_company_info(cache_key, info)
    return info


def prices_to_df(prices: list[Price]) -> pd.DataFrame:
    """Convert prices to a DataFrame."""
    df = pd.DataFrame([p.model_dump() for p in prices])
    df["Date"] = pd.to_datetime(df["time"])
    df.set_index("Date", inplace=True)
    numeric_cols = ["open", "close", "high", "low", "volume"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df.sort_index(inplace=True)
    return df


# Update the get_price_data function to use the new functions
def get_price_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    prices = get_prices(ticker, start_date, end_date)
    return prices_to_df(prices)
