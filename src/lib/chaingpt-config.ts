// ChainGPT API Configuration
export const CHAINGPT_CONFIG = {
  API_URL: 'https://api.chaingpt.org/v1',
  MODEL: 'chaingpt-4',
  MAX_TOKENS: 300,
  TEMPERATURE: 0.3,
  
  // Endpoints
  ENDPOINTS: {
    CHAT: '/chat/completions',
    ANALYSIS: '/analyze',
    PREDICTION: '/predict'
  },
  
  // Agent Types
  AGENTS: {
    TECHNICAL: 'technical-analyst',
    SENTIMENT: 'sentiment-analyst',
    FUNDAMENTAL: 'fundamental-analyst',
    NEWS: 'news-analyst',
    TRADING: 'trading-advisor'
  },
  
  // Confidence Thresholds
  CONFIDENCE: {
    HIGH: 80,
    MEDIUM: 60,
    LOW: 40
  }
};

// ChainGPT Integration Research Summary:
/*
ChainGPT is an AI infrastructure for Web3 that provides:

1. **AI Models**: 
   - ChainGPT-4: Advanced language model for crypto/blockchain
   - Specialized in DeFi, NFTs, trading analysis
   - Real-time market data integration

2. **API Capabilities**:
   - Chat completions for conversational AI
   - Market analysis and predictions
   - Technical indicator analysis
   - Sentiment analysis from social media/news
   - Smart contract analysis

3. **Integration Methods**:
   - REST API with Bearer token authentication
   - WebSocket for real-time updates
   - SDK for JavaScript/TypeScript
   - Webhook callbacks for async operations

4. **Use Cases for DuckOracle**:
   - Market outcome predictions
   - Risk assessment for trades
   - Automated market resolution
   - Real-time market sentiment tracking
   - Technical analysis for price predictions

5. **Pricing Structure**:
   - Pay-per-request model
   - Subscription tiers for high volume
   - Free tier with limited requests
   - Enterprise plans with custom models

6. **Best Practices**:
   - Use specific prompts for better accuracy
   - Implement confidence scoring
   - Combine multiple agent types
   - Cache results to reduce API calls
   - Handle rate limits gracefully

7. **Security Considerations**:
   - Store API keys securely
   - Validate all AI responses
   - Implement fallback mechanisms
   - Monitor usage and costs
   - Use HTTPS for all requests
*/

export const CHAINGPT_PROMPTS = {
  MARKET_ANALYSIS: `
    Analyze this prediction market and provide a detailed assessment.
    Consider technical indicators, market sentiment, historical patterns, and risk factors.
    Respond in JSON format with: outcome (boolean), confidence (0-100), probability (0-100), reasoning (string).
  `,
  
  TECHNICAL_ANALYSIS: `
    As a technical analyst, analyze the given prediction using:
    - Price action and chart patterns
    - Technical indicators (RSI, MACD, etc.)
    - Support/resistance levels
    - Volume analysis
    - Market trends
    Provide probability estimate and confidence level.
  `,
  
  SENTIMENT_ANALYSIS: `
    As a sentiment analyst, evaluate the prediction based on:
    - Social media sentiment
    - News sentiment and coverage
    - Market fear/greed indicators
    - Community discussions
    - Influencer opinions
    Assess probability based on sentiment data.
  `,
  
  TRADE_RECOMMENDATION: `
    Analyze this trade opportunity and provide:
    - Risk assessment (1-10 scale)
    - Expected return analysis
    - Optimal position sizing
    - Entry/exit strategy
    - Overall recommendation (BUY/HOLD/AVOID)
    Consider market conditions and user's risk profile.
  `
};