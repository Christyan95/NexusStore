import { describe, expect, it } from 'vitest';
import { RpcVitrineRowSchema } from './catalog.schemas';

const VALID_ROW = {
  IDEN_PROD: '33333333-3333-4000-8000-000000000001',
  SLUG_PROD: 'apple-airpods-pro-2',
  NOME_PROD: 'Apple AirPods Pro 2',
  DESC_PROD: 'Cancelamento de ruído',
  URLA_PROD: 'https://www.amazon.com.br/dp/B0CHWRXH8B',
  URLI_PROD: 'https://m.media-amazon.com/images/I/61SUj2aKoEL.jpg',
  PRAT_PROD: '1899.00',
  PROR_PROD: '2299.00',
  MOED_PROD: 'BRL',
  AVAL_PROD: '4.8',
  QAVA_PROD: 3420,
  DEST_PROD: true,
  SINC_PROD: '2026-11-24T11:10:00Z',
  CREA_PROD: '2026-11-24T11:10:00Z',
  IDEN_CATE: '11111111-1111-4000-8000-000000000001',
  NOME_CATE: 'Tecnologia',
  SLUG_CATE: 'tecnologia',
  IDEN_PLAT: '22222222-2222-4000-8000-000000000001',
  NOME_PLAT: 'Amazon',
  SLUG_PLAT: 'amazon',
  DOMI_PLAT: 'amazon.com.br',
  CORP_PLAT: '#007185',
  TOTA_ITEN: 1,
};

describe('RpcVitrineRowSchema contract validation', () => {
  it('aceita DTO válido e converte strings NUMERIC com segurança', () => {
    const parsed = RpcVitrineRowSchema.safeParse(VALID_ROW);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.PRAT_PROD).toBe(1899);
      expect(parsed.data.AVAL_PROD).toBe(4.8);
    }
  });

  it('rejeita PROR_PROD menor que PRAT_PROD, preço zero e URL não-HTTPS', () => {
    expect(RpcVitrineRowSchema.safeParse({ ...VALID_ROW, PROR_PROD: 1000 }).success).toBe(false);
    expect(RpcVitrineRowSchema.safeParse({ ...VALID_ROW, PRAT_PROD: 0 }).success).toBe(false);
    expect(
      RpcVitrineRowSchema.safeParse({ ...VALID_ROW, URLA_PROD: 'javascript:alert(1)' }).success,
    ).toBe(false);
    expect(RpcVitrineRowSchema.safeParse({ ...VALID_ROW, AVAL_PROD: 5.5 }).success).toBe(false);
  });
});
