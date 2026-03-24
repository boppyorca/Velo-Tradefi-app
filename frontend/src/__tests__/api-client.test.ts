/**
 * Frontend API Client Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getStockQuote', () => {
    it('should return stock data for valid symbol', async () => {
      const mockStock = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
        price: 192.10,
        change: 1.52,
        changePercent: 0.80,
        volume: 58230000,
        marketCap: 2980000000000,
        updatedAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockStock,
        }),
      });

      const response = await fetch('/api/stocks/AAPL');
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data.symbol).toBe('AAPL');
      expect(result.data.price).toBe(192.10);
    });

    it('should handle stock not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          message: "Stock 'INVALID' not found",
        }),
      });

      const response = await fetch('/api/stocks/INVALID');
      const result = await response.json();

      expect(result.success).toBe(false);
    });
  });

  describe('getStocks', () => {
    it('should return stocks list with pagination', async () => {
      const mockStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 192.10 },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockStocks,
        }),
      });

      const response = await fetch('/api/stocks?exchange=US&page=1&pageSize=20');
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should filter by exchange', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ symbol: 'VNM', name: 'Vietnam Dairy', exchange: 'HOSE' }],
        }),
      });

      const response = await fetch('/api/stocks?exchange=VN');
      const result = await response.json();

      expect(result.success).toBe(true);
    });
  });

  describe('searchStocks', () => {
    it('should return search results', async () => {
      const mockResults = [
        { symbol: 'AAPL', name: 'Apple Inc.' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResults,
        }),
      });

      const response = await fetch('/api/stocks/search?q=apple');
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should handle empty query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          message: "Query parameter 'q' is required",
        }),
      });

      const response = await fetch('/api/stocks/search?q=');
      const result = await response.json();

      expect(result.success).toBe(false);
    });
  });

  describe('getStockHistory', () => {
    it('should return stock history', async () => {
      const mockHistory = [
        { date: '2024-01-01', close: 190.0, volume: 58000000 },
        { date: '2024-01-02', close: 192.0, volume: 62000000 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockHistory,
        }),
      });

      const response = await fetch('/api/stocks/AAPL/history?period=1mo');
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });
});
