from abc import ABC, abstractmethod
from typing import Optional, List
from data.models import Price, FinancialMetrics, LineItem, InsiderTrade, CompanyNews


class AbstractDataSource(ABC):
    """Abstract base class for data sources."""

    @abstractmethod
    def get_prices(self, ticker: str, start_date: str, end_date: str) -> List[Price]:
        """Get price data for a given ticker and date range."""
        pass

    @abstractmethod
    def get_financial_metrics(
        self, ticker: str, end_date: str, period: str = "ttm", limit: int = 10
    ) -> List[FinancialMetrics]:
        """Get financial metrics for a given ticker and date range."""
        pass

    @abstractmethod
    def search_line_items(
        self,
        ticker: str,
        line_items: List[str],
        end_date: str,
        period: str = "ttm",
        limit: int = 10,
    ) -> List[LineItem]:
        """Search for specific line items in financial statements."""
        pass

    @abstractmethod
    def get_insider_trades(
        self,
        ticker: str,
        end_date: str,
        start_date: Optional[str] = None,
        limit: int = 1000,
    ) -> List[InsiderTrade]:
        """Get insider trading data for a given ticker and date range."""
        pass

    @abstractmethod
    def get_company_news(
        self,
        ticker: str,
        end_date: str,
        start_date: Optional[str] = None,
        limit: int = 1000,
    ) -> List[CompanyNews]:
        """Get company news for a given ticker and date range."""
        pass

    @abstractmethod
    def get_market_cap(self, ticker: str, end_date: str) -> Optional[float]:
        """Get the market cap for a given ticker and date."""
        pass
