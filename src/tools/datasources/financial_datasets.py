import os
import requests
from typing import List, Optional
from data.cache import get_cache
from data.models import (
    Price,
    PriceResponse,
    FinancialMetrics,
    FinancialMetricsResponse,
    LineItem,
    LineItemResponse,
    InsiderTrade,
    InsiderTradeResponse,
    CompanyNews,
    CompanyNewsResponse,
)
from .base import AbstractDataSource


class FinancialDatasetsDataSource(AbstractDataSource):
    """FinancialDatasets.ai API Data Source."""

    def __init__(self):
        self.base_url = "https://api.financialdatasets.ai"
        self.api_key = os.environ.get("FINANCIAL_DATASETS_API_KEY")
        self.headers = {"X-API-KEY": self.api_key} if self.api_key else {}
        self._cache = get_cache()

    def _make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make a request to the FinancialDatasets API."""
        url = f"{self.base_url}{endpoint}"
        response = requests.request(method, url, headers=self.headers, **kwargs)
        if response.status_code != 200:
            raise Exception(
                f"API request failed: {response.status_code} - {response.text}"
            )
        return response

    def get_prices(self, ticker: str, start_date: str, end_date: str) -> List[Price]:
        # Check cache first
        if cached_data := self._cache.get_prices(ticker):
            # Filter cached data by date range and convert to Price objects
            filtered_data = [
                Price(**price)
                for price in cached_data
                if start_date <= price["time"] <= end_date
            ]
            if filtered_data:
                return filtered_data

        # If not in cache or no data in range, fetch from API
        endpoint = f"/prices/?ticker={ticker}&interval=day&interval_multiplier=1&start_date={start_date}&end_date={end_date}"
        response = self._make_request("GET", endpoint)
        price_response = PriceResponse(**response.json())

        # Cache the results
        if price_response.prices:
            self._cache.set_prices(
                ticker, [p.model_dump() for p in price_response.prices]
            )

        return price_response.prices or []

    def get_financial_metrics(
        self, ticker: str, end_date: str, period: str = "ttm", limit: int = 10
    ) -> List[FinancialMetrics]:
        # Check cache first
        if cached_data := self._cache.get_financial_metrics(ticker):
            # Filter cached data by date and limit
            filtered_data = [
                FinancialMetrics(**metric)
                for metric in cached_data
                if metric["report_period"] <= end_date
            ]
            filtered_data.sort(key=lambda x: x.report_period, reverse=True)
            if filtered_data:
                return filtered_data[:limit]

        # If not in cache or no data in range, fetch from API
        endpoint = f"/financial-metrics/?ticker={ticker}&report_period_lte={end_date}&limit={limit}&period={period}"
        response = self._make_request("GET", endpoint)
        metrics_response = FinancialMetricsResponse(**response.json())

        # Cache the results
        if metrics_response.financial_metrics:
            self._cache.set_financial_metrics(
                ticker, [m.model_dump() for m in metrics_response.financial_metrics]
            )

        return metrics_response.financial_metrics or []

    def search_line_items(
        self,
        ticker: str,
        line_items: List[str],
        end_date: str,
        period: str = "ttm",
        limit: int = 10,
    ) -> List[LineItem]:
        endpoint = "/financials/search/line-items"
        body = {
            "tickers": [ticker],
            "line_items": line_items,
            "end_date": end_date,
            "period": period,
            "limit": limit,
        }
        response = self._make_request("POST", endpoint, json=body)
        response_model = LineItemResponse(**response.json())
        return (
            response_model.search_results[:limit]
            if response_model.search_results
            else []
        )

    def get_insider_trades(
        self,
        ticker: str,
        end_date: str,
        start_date: Optional[str] = None,
        limit: int = 1000,
    ) -> List[InsiderTrade]:
        # Check cache first
        if cached_data := self._cache.get_insider_trades(ticker):
            # Filter cached data by date range
            filtered_data = [
                InsiderTrade(**trade)
                for trade in cached_data
                if (
                    start_date is None
                    or (trade.get("transaction_date") or trade["filing_date"])
                    >= start_date
                )
                and (trade.get("transaction_date") or trade["filing_date"]) <= end_date
            ]
            filtered_data.sort(
                key=lambda x: x.transaction_date or x.filing_date, reverse=True
            )
            if filtered_data:
                return filtered_data

        # If not in cache or insufficient data, fetch from API
        all_trades = []
        current_end_date = end_date

        while True:
            endpoint = (
                f"/insider-trades/?ticker={ticker}&filing_date_lte={current_end_date}"
            )
            if start_date:
                endpoint += f"&filing_date_gte={start_date}"
            endpoint += f"&limit={limit}"

            response = self._make_request("GET", endpoint)
            data = response.json()
            response_model = InsiderTradeResponse(**data)
            insider_trades = response_model.insider_trades

            if not insider_trades:
                break

            all_trades.extend(insider_trades)

            # Only continue pagination if we have a start_date and got a full page
            if not start_date or len(insider_trades) < limit:
                break

            # Update end_date to the oldest filing date from current batch for next iteration
            current_end_date = min(t.filing_date for t in insider_trades).split("T")[0]

            # If we've reached or passed the start_date, we can stop
            if current_end_date <= start_date:
                break

        # Cache the results
        if all_trades:
            self._cache.set_insider_trades(
                ticker, [trade.model_dump() for trade in all_trades]
            )

        return all_trades or []

    def get_company_news(
        self,
        ticker: str,
        end_date: str,
        start_date: Optional[str] = None,
        limit: int = 1000,
    ) -> List[CompanyNews]:
        # Check cache first
        if cached_data := self._cache.get_company_news(ticker):
            # Filter cached data by date range
            filtered_data = [
                CompanyNews(**news)
                for news in cached_data
                if (start_date is None or news["date"] >= start_date)
                and news["date"] <= end_date
            ]
            filtered_data.sort(key=lambda x: x.date, reverse=True)
            if filtered_data:
                return filtered_data

        # If not in cache or insufficient data, fetch from API
        all_news = []
        current_end_date = end_date

        while True:
            endpoint = f"/news/?ticker={ticker}&end_date={current_end_date}"
            if start_date:
                endpoint += f"&start_date={start_date}"
            endpoint += f"&limit={limit}"

            response = self._make_request("GET", endpoint)
            data = response.json()
            response_model = CompanyNewsResponse(**data)
            company_news = response_model.news

            if not company_news:
                break

            all_news.extend(company_news)

            # Only continue pagination if we have a start_date and got a full page
            if not start_date or len(company_news) < limit:
                break

            # Update end_date to the oldest date from current batch for next iteration
            current_end_date = min(news.date for news in company_news).split("T")[0]

            # If we've reached or passed the start_date, we can stop
            if current_end_date <= start_date:
                break

        # Cache the results
        if all_news:
            self._cache.set_company_news(
                ticker, [news.model_dump() for news in all_news]
            )
        return all_news or []

    def get_market_cap(self, ticker: str, end_date: str) -> Optional[float]:
        metrics = self.get_financial_metrics(ticker, end_date, limit=1)
        return metrics[0].market_cap if metrics else None
