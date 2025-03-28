import akshare as ak
from .base import AbstractDataSource
from typing import List, Optional
from data.cache import get_cache
from data.models import (
    Price,
    FinancialMetrics,
    LineItem,
    InsiderTrade,
    CompanyNews,
)


class AkshareDataSource(AbstractDataSource):
    """Data source for Akshare."""

    def __init__(self):
        self._cache = get_cache()

    def get_prices(self, ticker: str, start_date: str, end_date: str) -> List[Price]:
        # Check cache first
        if cached_data := self._cache.get_prices(ticker):
            filtered_data = [
                Price(**price)
                for price in cached_data
                if start_date <= price["time"] <= end_date
            ]
            if filtered_data:
                return filtered_data

        # Fetch data from Akshare
        try:
            df = ak.stock_zh_a_hist(
                symbol=ticker,
                period="daily",
                start_date=start_date,
                end_date=end_date,
                adjust="hfq",  # 后复权
            )

            # Convert to Price objects
            prices = []
            for _, row in df.iterrows():
                prices.append(
                    Price(
                        open=row["开盘"],
                        close=row["收盘"],
                        high=row["最高"],
                        low=row["最低"],
                        volume=int(row["成交量"]),
                        time=row["日期"].strftime("%Y-%m-%d"),
                    )
                )

            # Cache the results
            if prices:
                self._cache.set_prices(ticker, [p.model_dump() for p in prices])

            return prices

        except Exception as e:
            print(f"Error fetching prices from Akshare: {e}")
            return []

    def get_financial_metrics(
        self, ticker: str, end_date: str, period: str = "ttm", limit: int = 10
    ) -> List[FinancialMetrics]:
        pass

    def search_line_items(
        self,
        ticker: str,
        line_items: List[str],
        end_date: str,
        period: str = "ttm",
        limit: int = 10,
    ) -> List[LineItem]:
        pass

    def get_insider_trades(
        self,
        ticker: str,
        end_date: str,
        start_date: Optional[str] = None,
        limit: int = 1000,
    ) -> List[InsiderTrade]:
        pass

    def get_company_news(
        self,
        ticker: str,
        end_date: str,
        start_date: Optional[str] = None,
        limit: int = 1000,
    ) -> List[CompanyNews]:
        pass

    def get_market_cap(self, ticker: str, end_date: str) -> Optional[float]:
        pass
