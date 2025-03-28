import akshare as ak

stock_financial_report_sina_df = ak.stock_financial_report_sina(stock="sh600600", symbol="利润表")
print(stock_financial_report_sina_df)

print(stock_financial_report_sina_df.columns)