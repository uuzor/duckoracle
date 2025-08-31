// src/services/chainGPTService.js
import axios from 'axios';
import Web3 from 'web3';

class ChainGPTService {
    constructor() {
        this.apiKey = process.env.REACT_APP_CHAINGPT_API_KEY;
        this.baseURL = 'https://api.chaingpt.org/v1';
        this.web3 = null;
        this.duckOracleContract = null;
        this.chainGPTOracleContract = null;
        
        // Contract ABIs (simplified)
        this.duckOracleABI = [
            {
                "inputs": [{"type": "uint256", "name": "marketId"}],
                "name": "requestAIResolution",
                "outputs": [],
                "type": "function"
            },
            {
                "inputs": [
                    {"type": "string", "name": "question"},
                    {"type": "string", "name": "resolutionCriteria"},
                    {"type": "string", "name": "category"},
                    {"type": "string[]", "name": "tags"},
                    {"type": "string", "name": "description"},
                    {"type": "string[]", "name": "dataSources"},
                    {"type": "uint8", "name": "dataSource"},
                    {"type": "uint8", "name": "marketType"},
                    {"type": "uint256", "name": "resolutionTime"},
                    {"type": "uint256", "name": "initialLiquidity"},
                    {"type": "uint256", "name": "tradingFee"}
                ],
                "name": "createMarket",
                "outputs": [{"type": "uint256"}],
                "type": "function"
            },
            {
                "inputs": [
                    {"type": "uint256", "name": "marketId"},
                    {"type": "bool", "name": "outcome"},
                    {"type": "uint256", "name": "minShares"},
                    {"type": "uint256", "name": "maxCost"}
                ],
                "name": "buyShares",
                "outputs": [{"type": "uint256"}],
                "type": "function"
            }
        ];

        this.chainGPTOracleABI = [
            {
                "inputs": [
                    {"type": "string", "name": "name"},
                    {"type": "string[]", "name": "specializations"},
                    {"type": "uint256[]", "name": "expertiseLevels"}
                ],
                "name": "registerAIAgent",
                "outputs": [],
                "type": "function"
            },
            {
                "inputs": [
                    {"type": "bytes32", "name": "requestId"},
                    {"type": "bool", "name": "outcome"},
                    {"type": "uint256", "name": "confidence"},
                    {"type": "string", "name": "reasoning"},
                    {"type": "uint256", "name": "stakeAmount"}
                ],
                "name": "submitPrediction",
                "outputs": [],
                "type": "function"
            }
        ];
    }

    // Initialize Web3 and contracts
    async init(provider) {
        try {
            this.web3 = new Web3(provider);
            
            // Contract addresses (from deployment)
            const duckOracleAddress = process.env.REACT_APP_DUCK_ORACLE_ADDRESS;
            const chainGPTOracleAddress = process.env.REACT_APP_CHAINGPT_ORACLE_ADDRESS;
            
            this.duckOracleContract = new this.web3.eth.Contract(
                this.duckOracleABI,
                duckOracleAddress
            );
            
            this.chainGPTOracleContract = new this.web3.eth.Contract(
                this.chainGPTOracleABI,
                chainGPTOracleAddress
            );
            
            console.log('ChainGPT Service initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize ChainGPT Service:', error);
            return false;
        }
    }

    // AI Prediction Methods
    async generateMarketAnalysis(marketData) {
        try {
            const response = await axios.post(`${this.baseURL}/analyze`, {
                prompt: `Analyze this prediction market: "${marketData.question}". 
                        Resolution criteria: ${marketData.resolutionCriteria}. 
                        Category: ${marketData.category}. 
                        Current odds: YES ${marketData.yesOdds}x, NO ${marketData.noOdds}x.
                        Provide detailed analysis including probability assessment, key factors, and reasoning.`,
                model: 'chaingpt-4',
                temperature: 0.7,
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                analysis: response.data.choices[0].text,
                confidence: this.extractConfidence(response.data.choices[0].text),
                prediction: this.extractPrediction(response.data.choices[0].text)
            };
        } catch (error) {
            console.error('Market analysis failed:', error);
            throw new Error('Failed to generate market analysis');
        }
    }

    async getAIPredictions(marketId, question, dataSources = []) {
        try {
            // Generate multiple AI predictions using different prompts
            const predictions = await Promise.all([
                this.getTechnicalAnalysis(question, dataSources),
                this.getSentimentAnalysis(question),
                this.getHistoricalAnalysis(question),
                this.getNewsAnalysis(question)
            ]);

            // Aggregate predictions
            const aggregatedPrediction = this.aggregatePredictions(predictions);
            
            return {
                individual: predictions,
                aggregated: aggregatedPrediction,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('AI prediction failed:', error);
            throw error;
        }
    }

    async getTechnicalAnalysis(question, dataSources) {
        const prompt = `
        As a technical analyst, analyze this prediction: "${question}"
        Available data sources: ${dataSources.join(', ')}
        
        Provide:
        1. Technical indicators analysis
        2. Price action assessment  
        3. Support/resistance levels
        4. Probability estimate (0-100)
        5. Confidence level (0-100)
        6. Key risk factors
        
        Format response as JSON with fields: outcome (true/false), probability, confidence, reasoning, risks
        `;

        return await this.callChainGPT(prompt, 'technical-analyst');
    }

    async getSentimentAnalysis(question) {
        const prompt = `
        As a sentiment analyst, analyze this prediction: "${question}"
        
        Consider:
        1. Market sentiment indicators
        2. Social media trends
        3. News sentiment
        4. Fear/Greed index implications
        5. Community discussions
        
        Provide probability estimate (0-100), confidence level (0-100), and detailed reasoning.
        Format as JSON: {outcome: boolean, probability: number, confidence: number, reasoning: string}
        `;

        return await this.callChainGPT(prompt, 'sentiment-analyst');
    }

    async getHistoricalAnalysis(question) {
        const prompt = `
        As a historical analyst, analyze this prediction: "${question}"
        
        Examine:
        1. Historical precedents and patterns
        2. Cyclical trends and seasonality
        3. Similar past events and outcomes
        4. Long-term market behavior
        5. Fundamental analysis
        
        Provide probability estimate and confidence level with detailed historical context.
        Format as JSON: {outcome: boolean, probability: number, confidence: number, reasoning: string}
        `;

        return await this.callChainGPT(prompt, 'historical-analyst');
    }

    async getNewsAnalysis(question) {
        const prompt = `
        As a news analyst, analyze this prediction: "${question}"
        
        Consider:
        1. Recent news developments
        2. Regulatory changes
        3. Industry announcements
        4. Economic indicators
        5. Geopolitical factors
        
        Provide probability assessment with news-based reasoning.
        Format as JSON: {outcome: boolean, probability: number, confidence: number, reasoning: string}
        `;

        return await this.callChainGPT(prompt, 'news-analyst');
    }

    async callChainGPT(prompt, agentType = 'general') {
        try {
            const response = await axios.post(`${this.baseURL}/chat/completions`, {
                model: 'chaingpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert ${agentType} specializing in cryptocurrency and financial market predictions. Always provide responses in valid JSON format.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3, // Lower temperature for more consistent results
                max_tokens: 400
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const content = response.data.choices[0].message.content;
            
            try {
                return JSON.parse(content);
            } catch (parseError) {
                // Fallback parsing if JSON is malformed
                return this.fallbackParsing(content);
            }
        } catch (error) {
            console.error(`ChainGPT API call failed for ${agentType}:`, error);
            throw error;
        }
    }

    // Smart Contract Integration
    async createMarketWithAI(marketData, userAddress) {
        try {
            // Generate AI analysis for the market
            const aiAnalysis = await this.generateMarketAnalysis(marketData);
            
            // Prepare transaction
            const tx = this.duckOracleContract.methods.createMarket(
                marketData.question,
                marketData.resolutionCriteria,
                marketData.category,
                marketData.tags,
                marketData.description,
                marketData.dataSources,
                marketData.dataSource, // enum value
                marketData.marketType, // enum value
                Math.floor(Date.parse(marketData.resolutionTime) / 1000),
                this.web3.utils.toWei(marketData.initialLiquidity.toString(), 'ether'),
                marketData.tradingFee
            );

            const gasEstimate = await tx.estimateGas({ from: userAddress });
            const gasPrice = await this.web3.eth.getGasPrice();

            const result = await tx.send({
                from: userAddress,
                gas: Math.floor(gasEstimate * 1.2), // 20% buffer
                gasPrice: gasPrice
            });

            return {
                marketId: result.events.MarketCreated.returnValues.marketId,
                transactionHash: result.transactionHash,
                aiAnalysis: aiAnalysis
            };
        } catch (error) {
            console.error('Market creation failed:', error);
            throw error;
        }
    }

    async requestAIResolution(marketId, userAddress) {
        try {
            const tx = this.duckOracleContract.methods.requestAIResolution(marketId);
            
            const gasEstimate = await tx.estimateGas({ from: userAddress });
            const gasPrice = await this.web3.eth.getGasPrice();

            const result = await tx.send({
                from: userAddress,
                gas: Math.floor(gasEstimate * 1.2),
                gasPrice: gasPrice
            });

            return result.transactionHash;
        } catch (error) {
            console.error('AI resolution request failed:', error);
            throw error;
        }
    }

    async buySharesWithAI(marketId, outcome, maxCost, userAddress) {
        try {
            // Get AI recommendation before trade
            const recommendation = await this.getTradeRecommendation(marketId, outcome, maxCost);
            
            const tx = this.duckOracleContract.methods.buyShares(
                marketId,
                outcome,
                1, // minShares
                this.web3.utils.toWei(maxCost.toString(), 'ether')
            );

            const gasEstimate = await tx.estimateGas({ from: userAddress });
            const gasPrice = await this.web3.eth.getGasPrice();

            const result = await tx.send({
                from: userAddress,
                gas: Math.floor(gasEstimate * 1.2),
                gasPrice: gasPrice
            });

            return {
                transactionHash: result.transactionHash,
                recommendation: recommendation,
                shares: result.events.SharesTraded.returnValues.shares
            };
        } catch (error) {
            console.error('Share purchase failed:', error);
            throw error;
        }
    }

    async registerAsAIAgent(agentData, userAddress) {
        try {
            const tx = this.chainGPTOracleContract.methods.registerAIAgent(
                agentData.name,
                agentData.specializations,
                agentData.expertiseLevels
            );

            const gasEstimate = await tx.estimateGas({ from: userAddress });
            const gasPrice = await this.web3.eth.getGasPrice();

            const result = await tx.send({
                from: userAddress,
                gas: Math.floor(gasEstimate * 1.2),
                gasPrice: gasPrice
            });

            return result.transactionHash;
        } catch (error) {
            console.error('AI agent registration failed:', error);
            throw error;
        }
    }

    // Utility Methods
    aggregatePredictions(predictions) {
        const validPredictions = predictions.filter(p => p && typeof p.confidence === 'number');
        
        if (validPredictions.length === 0) {
            return { outcome: false, confidence: 0, reasoning: 'No valid predictions' };
        }

        // Weighted average based on confidence
        let totalWeight = 0;
        let weightedSum = 0;
        let reasoning = [];

        validPredictions.forEach(pred => {
            const weight = pred.confidence / 100;
            totalWeight += weight;
            weightedSum += (pred.outcome ? 1 : 0) * weight;
            reasoning.push(`${pred.reasoning} (Confidence: ${pred.confidence}%)`);
        });

        const avgProbability = weightedSum / totalWeight;
        const outcome = avgProbability > 0.5;
        const confidence = Math.round(Math.abs(avgProbability - 0.5) * 200); // Convert to 0-100 scale

        return {
            outcome,
            confidence,
            probability: Math.round(avgProbability * 100),
            reasoning: reasoning.join('\n\n'),
            agentCount: validPredictions.length
        };
    }

    async getTradeRecommendation(marketId, outcome, amount) {
        const prompt = `
        Analyze this trade opportunity:
        Market ID: ${marketId}
        Intended outcome: ${outcome ? 'YES' : 'NO'}
        Investment amount: ${amount} DUCK
        
        Provide:
        1. Risk assessment (1-10)
        2. Expected return analysis
        3. Optimal timing recommendation
        4. Alternative strategies
        5. Overall recommendation (BUY/HOLD/AVOID)
        
        Format as JSON: {recommendation: string, risk: number, expectedReturn: number, reasoning: string}
        `;

        return await this.callChainGPT(prompt, 'trading-advisor');
    }

    extractConfidence(text) {
        // Extract confidence percentage from text
        const match = text.match(/confidence[:\s]*(\d+)%/i);
        return match ? parseInt(match[1]) : 50;
    }

    extractPrediction(text) {
        // Extract YES/NO or TRUE/FALSE prediction
        const yesMatch = text.toLowerCase().includes('yes') || text.toLowerCase().includes('true');
        const noMatch = text.toLowerCase().includes('no') || text.toLowerCase().includes('false');
        
        if (yesMatch && !noMatch) return true;
        if (noMatch && !yesMatch) return false;
        return null; // Uncertain
    }

    fallbackParsing(content) {
        // Attempt to extract structured data from non-JSON response
        try {
            const confidence = this.extractConfidence(content);
            const outcome = this.extractPrediction(content);
            
            return {
                outcome: outcome !== null ? outcome : false,
                confidence: confidence,
                probability: confidence,
                reasoning: content.substring(0, 200) + '...'
            };
        } catch (error) {
            return {
                outcome: false,
                confidence: 0,
                probability: 0,
                reasoning: 'Failed to parse AI response'
            };
        }
    }

    // WebSocket for real-time AI updates
    connectToAIUpdates(marketId, callback) {
        const ws = new WebSocket(`${this.baseURL.replace('http', 'ws')}/markets/${marketId}/ai-updates`);
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                callback(data);
            } catch (error) {
                console.error('WebSocket message parsing error:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return ws;
    }
}

// React Hook for ChainGPT Integration
import { useState, useEffect, useCallback } from 'react';

export const useChainGPT = () => {
    const [chainGPT, setChainGPT] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initChainGPT = async () => {
            try {
                const service = new ChainGPTService();
                
                if (window.ethereum) {
                    const success = await service.init(window.ethereum);
                    if (success) {
                        setChainGPT(service);
                        setIsInitialized(true);
                    }
                }
            } catch (err) {
                setError(err.message);
            }
        };

        initChainGPT();
    }, []);

    const getAIAnalysis = useCallback(async (marketData) => {
        if (!chainGPT) throw new Error('ChainGPT not initialized');
        return await chainGPT.generateMarketAnalysis(marketData);
    }, [chainGPT]);

    const createAIMarket = useCallback(async (marketData, userAddress) => {
        if (!chainGPT) throw new Error('ChainGPT not initialized');
        return await chainGPT.createMarketWithAI(marketData, userAddress);
    }, [chainGPT]);

    const getAIPredictions = useCallback(async (marketId, question, dataSources) => {
        if (!chainGPT) throw new Error('ChainGPT not initialized');
        return await chainGPT.getAIPredictions(marketId, question, dataSources);
    }, [chainGPT]);

    const buyWithAI = useCallback(async (marketId, outcome, maxCost, userAddress) => {
        if (!chainGPT) throw new Error('ChainGPT not initialized');
        return await chainGPT.buySharesWithAI(marketId, outcome, maxCost, userAddress);
    }, [chainGPT]);

    return {
        chainGPT,
        isInitialized,
        error,
        getAIAnalysis,
        createAIMarket,
        getAIPredictions,
        buyWithAI
    };
};

export default ChainGPTService;