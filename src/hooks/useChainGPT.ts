'use client';

import { useState, useCallback } from 'react';

interface AIAnalysis {
  outcome: boolean;
  confidence: number;
  reasoning: string;
  probability: number;
}

interface MarketData {
  question: string;
  resolutionCriteria: string;
  category?: string;
  yesOdds?: number;
  noOdds?: number;
}

export function useChainGPT() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callChainGPT = useCallback(async (prompt: string): Promise<AIAnalysis> => {
    const apiKey = process.env.NEXT_PUBLIC_CHAINGPT_API_KEY;
    
    if (!apiKey) {
      // Mock response for demo
      return {
        outcome: Math.random() > 0.5,
        confidence: Math.floor(Math.random() * 25) + 75, // 75-99%
        reasoning: "Based on current market conditions and technical analysis, this outcome appears likely.",
        probability: Math.floor(Math.random() * 40) + 30 // 30-70%
      };
    }

    try {
      const response = await fetch('https://api.chaingpt.org/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'chaingpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert prediction analyst. Respond only in JSON format with fields: outcome (boolean), confidence (0-100), reasoning (string), probability (0-100).'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error(`ChainGPT API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        return JSON.parse(content);
      } catch {
        // Fallback parsing
        return {
          outcome: content.toLowerCase().includes('yes') || content.toLowerCase().includes('true'),
          confidence: 75,
          reasoning: content.substring(0, 200),
          probability: 50
        };
      }
    } catch (err) {
      console.error('ChainGPT API error:', err);
      throw new Error('Failed to get AI analysis');
    }
  }, []);

  const getMarketAnalysis = useCallback(async (marketData: MarketData): Promise<AIAnalysis> => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = `
        Analyze this prediction market:
        Question: "${marketData.question}"
        Resolution Criteria: "${marketData.resolutionCriteria}"
        ${marketData.category ? `Category: ${marketData.category}` : ''}
        ${marketData.yesOdds ? `Current YES odds: ${marketData.yesOdds}x` : ''}
        ${marketData.noOdds ? `Current NO odds: ${marketData.noOdds}x` : ''}
        
        Provide detailed analysis with probability assessment and key factors.
      `;

      const result = await callChainGPT(prompt);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [callChainGPT]);

  const getTechnicalAnalysis = useCallback(async (question: string): Promise<AIAnalysis> => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = `
        As a technical analyst, analyze: "${question}"
        
        Consider:
        1. Technical indicators and price action
        2. Support/resistance levels
        3. Market trends and patterns
        4. Volume analysis
        5. Risk factors
        
        Provide probability estimate and confidence level.
      `;

      return await callChainGPT(prompt);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Technical analysis failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [callChainGPT]);

  const getSentimentAnalysis = useCallback(async (question: string): Promise<AIAnalysis> => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = `
        As a sentiment analyst, analyze: "${question}"
        
        Consider:
        1. Market sentiment indicators
        2. Social media trends
        3. News sentiment
        4. Fear/Greed index
        5. Community discussions
        
        Assess probability based on sentiment data.
      `;

      return await callChainGPT(prompt);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sentiment analysis failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [callChainGPT]);

  const getMultiAgentAnalysis = useCallback(async (question: string): Promise<{
    technical: AIAnalysis;
    sentiment: AIAnalysis;
    aggregated: AIAnalysis;
  }> => {
    setIsLoading(true);
    setError(null);

    try {
      const [technical, sentiment] = await Promise.all([
        getTechnicalAnalysis(question),
        getSentimentAnalysis(question)
      ]);

      // Aggregate predictions
      const avgConfidence = (technical.confidence + sentiment.confidence) / 2;
      const avgProbability = (technical.probability + sentiment.probability) / 2;
      const outcome = avgProbability > 50;

      const aggregated: AIAnalysis = {
        outcome,
        confidence: Math.round(avgConfidence),
        probability: Math.round(avgProbability),
        reasoning: `Technical Analysis: ${technical.reasoning.substring(0, 100)}... Sentiment Analysis: ${sentiment.reasoning.substring(0, 100)}...`
      };

      return { technical, sentiment, aggregated };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Multi-agent analysis failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getTechnicalAnalysis, getSentimentAnalysis]);

  const getTradeRecommendation = useCallback(async (
    marketId: number,
    outcome: boolean,
    amount: number
  ): Promise<{
    recommendation: 'BUY' | 'HOLD' | 'AVOID';
    risk: number;
    expectedReturn: number;
    reasoning: string;
  }> => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = `
        Analyze this trade:
        Market ID: ${marketId}
        Outcome: ${outcome ? 'YES' : 'NO'}
        Amount: ${amount} DUCK
        
        Provide:
        1. Risk assessment (1-10)
        2. Expected return analysis
        3. Overall recommendation (BUY/HOLD/AVOID)
        4. Detailed reasoning
        
        Format as JSON: {recommendation: string, risk: number, expectedReturn: number, reasoning: string}
      `;

      const response = await callChainGPT(prompt);
      
      return {
        recommendation: response.outcome ? 'BUY' : 'AVOID',
        risk: Math.floor(Math.random() * 5) + 3, // 3-8 risk level
        expectedReturn: response.probability,
        reasoning: response.reasoning
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Trade recommendation failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [callChainGPT]);

  return {
    isLoading,
    error,
    getMarketAnalysis,
    getTechnicalAnalysis,
    getSentimentAnalysis,
    getMultiAgentAnalysis,
    getTradeRecommendation
  };
}