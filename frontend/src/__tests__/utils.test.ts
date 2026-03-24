/**
 * Frontend Utility Functions Tests
 */

import { describe, it, expect } from 'vitest';
import { formatPrice, formatChange, formatVolume, formatMarketCap } from '@/lib/utils';

describe('formatPrice', () => {
  it('should format US stock prices with $', () => {
    expect(formatPrice(192.10, 'NASDAQ')).toBe('$192.10');
    expect(formatPrice(248.50, 'NYSE')).toBe('$248.50');
  });

  it('should format VN stock prices with ₫', () => {
    expect(formatPrice(78500, 'HOSE')).toBe('₫78,500');
    expect(formatPrice(145600, 'HOSE')).toBe('₫145,600');
  });

  it('should handle unknown exchange as USD', () => {
    expect(formatPrice(100.50, 'UNKNOWN')).toBe('$100.50');
  });
});

describe('formatChange', () => {
  it('should format positive change with +', () => {
    expect(formatChange(1.52)).toBe('+1.52');
    expect(formatChange(0.80)).toBe('+0.80');
  });

  it('should format negative change', () => {
    expect(formatChange(-1.25)).toBe('-1.25');
  });

  it('should format zero change', () => {
    expect(formatChange(0)).toBe('0.00');
  });
});

describe('formatVolume', () => {
  it('should format millions', () => {
    expect(formatVolume(58230000)).toBe('58.23M');
    expect(formatVolume(31800000)).toBe('31.80M');
  });

  it('should format thousands', () => {
    expect(formatVolume(3200000)).toBe('3.20M');
  });

  it('should format small volumes', () => {
    expect(formatVolume(1000)).toBe('1.00K');
    expect(formatVolume(500)).toBe('500');
  });
});

describe('formatMarketCap', () => {
  it('should format trillions', () => {
    expect(formatMarketCap(2980000000000)).toBe('$2.98T');
    expect(formatMarketCap(3100000000000)).toBe('$3.10T');
  });

  it('should format billions', () => {
    expect(formatMarketCap(792000000000)).toBe('$792.00B');
  });

  it('should format millions', () => {
    expect(formatMarketCap(138000000)).toBe('$138.00M');
  });
});
