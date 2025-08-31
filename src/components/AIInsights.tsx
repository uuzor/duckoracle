'use client';

import { useState, useEffect } from 'react';
import { useChainGPT } from '../hooks/useChainGPT';

interface AIInsightsProps {
  marketQuestion: string;
  marketId?: number;
}

export function AIInsights({ marketQuestion, marketId }: AIInsightsProps) {
  const [insights, setInsights] = useState<any>(null);
  const { getMultiAgentAnalysis, isLoading, error } = useChainGPT();

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const analysis = await getMultiAgentAnalysis(marketQuestion);
        setInsights(analysis);
      } catch (err) {
        console.error('Failed to load AI insights:', err);
      }
    };

    if (marketQuestion) {
      loadInsights();
    }
  }, [marketQuestion, getMultiAgentAnalysis]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 border-2 border-[#ea2a33] border-t-transparent rounded-full animate-spin"></div>
          <h3 className="text-lg font-bold text-gray-900">Loading AI Insights...</h3>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="bg-red-50 rounded-xl p-4 border border-red-200">
        <h3 className="text-lg font-bold text-red-900 mb-2">AI Analysis Unavailable</h3>
        <p className="text-red-700 text-sm">
          {error || 'Failed to load AI insights. Using fallback data.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Aggregated Prediction */}
      <div className="bg-gradient-to-r from-[#ea2a33] to-red-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">AI Consensus</h3>
          <div className="bg-white/20 rounded-full px-3 py-1">
            <span className="text-sm font-medium">{insights.aggregated.confidence}% Confidence</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-3">
          <div className="text-center">
            <div className={`text-2xl font-bold ${insights.aggregated.outcome ? 'text-green-300' : 'text-red-300'}`}>
              {insights.aggregated.outcome ? 'YES' : 'NO'}
            </div>
            <div className="text-xs opacity-80">Predicted Outcome</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {insights.aggregated.probability}%
            </div>
            <div className="text-xs opacity-80">Probability</div>
          </div>
        </div>
        
        <p className="text-sm opacity-90 leading-relaxed">
          {insights.aggregated.reasoning}
        </p>
      </div>

      {/* Individual Agent Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Technical Analysis */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              T
            </div>
            <div>
              <h4 className="font-bold text-blue-900">Technical Analysis</h4>
              <p className="text-xs text-blue-600">{insights.technical.confidence}% Confidence</p>
            </div>
          </div>
          
          <div className="mb-2">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
              insights.technical.outcome 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {insights.technical.outcome ? 'BULLISH' : 'BEARISH'}
            </span>
          </div>
          
          <p className="text-sm text-blue-800 leading-relaxed">
            {insights.technical.reasoning.substring(0, 120)}...
          </p>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
              S
            </div>
            <div>
              <h4 className="font-bold text-green-900">Sentiment Analysis</h4>
              <p className="text-xs text-green-600">{insights.sentiment.confidence}% Confidence</p>
            </div>
          </div>
          
          <div className="mb-2">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
              insights.sentiment.outcome 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {insights.sentiment.outcome ? 'POSITIVE' : 'NEGATIVE'}
            </span>
          </div>
          
          <p className="text-sm text-green-800 leading-relaxed">
            {insights.sentiment.reasoning.substring(0, 120)}...
          </p>
        </div>
      </div>

      {/* Confidence Meter */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-bold text-gray-900 mb-3">Prediction Confidence</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Technical</span>
            <span>{insights.technical.confidence}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${insights.technical.confidence}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Sentiment</span>
            <span>{insights.sentiment.confidence}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${insights.sentiment.confidence}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm font-bold">
            <span>Overall</span>
            <span>{insights.aggregated.confidence}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-[#ea2a33] h-3 rounded-full transition-all duration-500"
              style={{ width: `${insights.aggregated.confidence}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}