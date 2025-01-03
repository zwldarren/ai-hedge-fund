
from langchain_openai.chat_models import ChatOpenAI

from agents.state import AgentState
from tools.api import search_line_items, get_insider_trades, get_market_cap


llm = ChatOpenAI(model="gpt-4o")

def market_data_agent(state: AgentState):
    """Responsible for gathering and preprocessing market data"""
    messages = state["messages"]
    data = state["data"]
    start_date = data["start_date"]
    end_date = data["end_date"]

    return {
        "messages": messages,
        "data": {
            **data, 
        }
    }