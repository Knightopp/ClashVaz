export interface NormalizedCost {
  amount: number | null;
  currency: string | null;
}

export class CostNormalizer {
  /**
   * Normalizes cost string and infers currency
   */
  public normalize(rawCost: string | null | undefined, headerHint?: string): NormalizedCost {
    if (!rawCost || typeof rawCost !== 'string') {
      return { amount: null, currency: null };
    }

    const trimmed = rawCost.trim();
    if (trimmed === '' || trimmed === '-' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'free') {
      return { amount: trimmed.toLowerCase() === 'free' ? 0 : null, currency: null };
    }

    // Infer currency from header or value
    let currency: string | null = null;
    const combined = `${headerHint ?? ''} ${trimmed}`.toLowerCase();

    if (combined.includes('dark elixir')) {
      currency = 'Dark Elixir';
    } else if (combined.includes('elixir')) {
      currency = 'Elixir';
    } else if (combined.includes('gold')) {
      currency = 'Gold';
    } else if (combined.includes('gem')) {
      currency = 'Gems';
    } else {
      // Default for defensive buildings in Clash of Clans
      currency = 'Gold';
    }

    // Extract numeric amount by removing commas, currency symbols, and spaces
    const cleanNumStr = trimmed.replace(/,/g, '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanNumStr);

    if (isNaN(num)) {
      return { amount: null, currency };
    }

    return {
      amount: Math.round(num),
      currency
    };
  }
}

export const costNormalizer = new CostNormalizer();
