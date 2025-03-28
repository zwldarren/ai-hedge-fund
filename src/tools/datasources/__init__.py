from .akshare import AkshareDataSource
from .financial_datasets import FinancialDatasetsDataSource
from .base import AbstractDataSource

_data_source = FinancialDatasetsDataSource()
def get_data_source() -> AbstractDataSource:
    """Get the default data source."""
    return _data_source

def register_data_source(data_source: AbstractDataSource):
    """Register a new data source."""
    global _data_source
    _data_source = data_source
