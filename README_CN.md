# AI 对冲基金

这是一个AI驱动的对冲基金概念验证项目。本项目的目标是探索使用AI进行交易决策。本项目仅用于**教育**目的，不用于实际交易或投资。

<div align="center">

[English](./README.md) · **简体中文**

</div>

该系统由多个协同工作的智能体组成：

1. 本杰明·格雷厄姆智能体 - 价值投资之父，只购买有安全边际的隐藏宝石
2. 比尔·阿克曼智能体 - 激进投资者，采取大胆头寸并推动变革
3. 凯茜·伍德智能体 - 成长投资女王，相信创新和颠覆的力量
4. 查理·芒格智能体 - 沃伦·巴菲特的搭档，只以合理价格购买优秀企业
5. 菲利普·费舍智能体 - 精通小道消息分析的传奇成长投资者
6. 斯坦利·德鲁肯米勒智能体 - 寻找具有增长潜力的不对称机会的宏观大师
7. 沃伦·巴菲特智能体 - 奥马哈先知，寻找价格合理的优秀公司
8. 估值智能体 - 计算股票内在价值并生成交易信号
9. 情绪智能体 - 分析市场情绪并生成交易信号
10. 基本面智能体 - 分析基本面数据并生成交易信号
11. 技术面智能体 - 分析技术指标并生成交易信号
12. 风险管理智能体 - 计算风险指标并设置头寸限制
13. 组合管理智能体 - 做出最终交易决策并生成订单
    
<img width="1042" alt="截图" src="https://github.com/user-attachments/assets/cbae3dcf-b571-490d-b0ad-3f0f035ac0d4" />

**注意**：该系统模拟交易决策，不进行实际交易。

[![Twitter 关注](https://img.shields.io/twitter/follow/virattt?style=social)](https://twitter.com/virattt)

## 免责声明

本项目仅用于**教育和研究目的**。

- 不用于实际交易或投资
- 不提供任何保证
- 过往表现不代表未来结果
- 创作者不对财务损失承担责任
- 投资决策请咨询财务顾问

使用本软件即表示您同意仅将其用于学习目的。

## 目录
- [安装](#安装)
- [使用](#使用)
  - [运行对冲基金](#运行对冲基金)
  - [运行回测器](#运行回测器)
  - [自定义模型](#自定义模型)
- [项目结构](#项目结构)
- [贡献](#贡献)
- [功能请求](#功能请求)
- [许可证](#许可证)

## 安装

克隆仓库：
```bash
git clone https://github.com/zwldarren/ai-hedge-fund.git
cd ai-hedge-fund
```

1. 安装UV(如果尚未安装):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. 安装依赖:
```bash
uv sync
```

3. 设置环境变量：
```bash
# 创建.env文件存放API密钥
cp .env.example .env
```

4. (可选) 编辑models.yaml文件配置自定义模型(参见[自定义模型](#自定义模型)部分)

5. 设置API密钥：
```bash
# 用于运行OpenAI托管的LLM(gpt-4o, gpt-4o-mini等)
# 从https://platform.openai.com/获取OpenAI API密钥
OPENAI_API_KEY=your-openai-api-key
OPENAI_API_BASE=https://api.openai.com/v1

# 用于运行Groq托管的LLM(deepseek, llama3等)
# 从https://groq.com/获取Groq API密钥
GROQ_API_KEY=your-groq-api-key

# 用于获取为对冲基金提供动力的金融数据
# 从https://financialdatasets.ai/获取金融数据集API密钥
FINANCIAL_DATASETS_API_KEY=your-financial-datasets-api-key
```

**重要**：必须设置`OPENAI_API_KEY`、`GROQ_API_KEY`、`ANTHROPIC_API_KEY`或`DEEPSEEK_API_KEY`才能使对冲基金工作。如果想使用所有提供商的LLM，则需要设置所有API密钥。

AAPL、GOOGL、MSFT、NVDA和TSLA的金融数据是免费的，不需要API密钥。

对于任何其他股票代码，需要在.env文件中设置`FINANCIAL_DATASETS_API_KEY`。

## 使用

### 运行对冲基金
```bash
uv run src/main.py --ticker AAPL,MSFT,NVDA
```

**示例输出：**
<img width="992" alt="截图 2025-01-06 下午5:50:17" src="https://github.com/user-attachments/assets/e8ca04bf-9989-4a7d-a8b4-34e04666663b" />

您还可以指定`--show-reasoning`标志将每个智能体的推理打印到控制台。

```bash
uv run src/main.py --ticker AAPL,MSFT,NVDA --show-reasoning
```

您也可以指定自定义模型配置文件：
```bash
uv run src/main.py --ticker AAPL,MSFT,NVDA --models-config models.yaml
```

您可以选择指定开始和结束日期来为特定时间段做出决策。

```bash
uv run src/main.py --ticker AAPL,MSFT,NVDA --start-date 2024-01-01 --end-date 2024-03-01 
```

### 运行回测器

```bash
uv run src/backtester.py --ticker AAPL,MSFT,NVDA
```

**示例输出：**
<img width="941" alt="截图" src="https://github.com/user-attachments/assets/00e794ea-8628-44e6-9a84-8f8a31ad3b47" />

您可以选择指定开始和结束日期来回测特定时间段。

```bash
uv run src/backtester.py --ticker AAPL,MSFT,NVDA --start-date 2024-01-01 --end-date 2024-03-01
```

### 自定义模型

您可以通过编辑`models.yaml`文件来自定义对冲基金使用的LLM模型。系统支持以下提供商的模型：

- Anthropic (claude-3.5-haiku, claude-3.5-sonnet, claude-3.7-sonnet)
- Deepseek (deepseek-v3, deepseek-r1)
- Gemini (gemini-2.0-flash, gemini-2.0-pro)
- Groq (llama-3.3-70b)
- OpenAI (gpt-4.5, gpt-4o, o1, o3-mini)

配置自定义模型的步骤：

1. 按照现有格式编辑`models.yaml`文件
2. 每个模型条目应包含：
   - `model_name`: 提供商的模型标识符
   - `display_name`: 可读性强的名称(在UI中显示)
   - `provider`: 小写的提供商名称(anthropic, deepseek, gemini, groq, openai)

示例配置:
```yaml
models:
  - model_name: "claude-3-5-sonnet-latest"
    display_name: "[anthropic] claude-3.5-sonnet"
    provider: "anthropic"
  
  - model_name: "gpt-4o"
    display_name: "[openai] gpt-4o" 
    provider: "openai"
```

然后使用您的自定义模型文件运行对冲基金:
```bash
uv run src/main.py --ticker AAPL,MSFT,NVDA --models-config models.yaml
```

## 贡献

1. Fork 仓库
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建拉取请求

**重要**：请保持您的拉取请求小而专注。这将便于审查和合并。

## 功能请求

如果有功能请求，请提交[issue](https://github.com/virattt/ai-hedge-fund/issues)并确保标记为`enhancement`。

## 许可证

本项目采用MIT许可证 - 详见LICENSE文件。
