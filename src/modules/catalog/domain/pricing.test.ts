import { describe, expect, it } from 'vitest';
import { calculateRealDiscountPercent, formatMoney } from './pricing';

describe('pricing domain rules', () => {
  it('formata valores em BRL com exatamente 2 casas decimais', () => {
    expect(formatMoney(1899, 'BRL').replace(/\u00A0/g, ' ')).toBe('R$ 1.899,00');
    expect(formatMoney(89.999, 'BRL').replace(/\u00A0/g, ' ')).toBe('R$ 90,00');
  });

  it('retorna Indisponível para preços inválidos ou não positivos', () => {
    expect(formatMoney(0, 'BRL')).toBe('Indisponível');
    expect(formatMoney(-10, 'BRL')).toBe('Indisponível');
    expect(formatMoney(Number.NaN, 'BRL')).toBe('Indisponível');
  });

  it('calcula desconto apenas quando existe originalPrice real maior que currentPrice', () => {
    expect(calculateRealDiscountPercent(1899, 2299)).toBe(17);
    expect(calculateRealDiscountPercent(499, null)).toBeNull();
    expect(calculateRealDiscountPercent(499, 499)).toBeNull();
    expect(calculateRealDiscountPercent(499, 300)).toBeNull();
  });
});
