import { describe, expect, it } from 'vitest';
import { parseQueryFromSearch, serializeQueryToSearch } from './use-catalog-query-params';

describe('catalog URL query params serialization', () => {
  it('converte query params válidos e sanitiza valores maliciosos/inválidos', () => {
    const parsed = parseQueryFromSearch(
      '?q=AirPods&categoria=Tecnologia&plataforma=Amazon&destaque=1&ordem=MENOR_PRECO&pagina=3',
    );

    expect(parsed.search).toBe('AirPods');
    expect(parsed.categorySlug).toBe('tecnologia');
    expect(parsed.platformSlug).toBe('amazon');
    expect(parsed.onlyTrending).toBe(true);
    expect(parsed.sortBy).toBe('MENOR_PRECO');
    expect(parsed.page).toBe(3);

    const sanitized = parseQueryFromSearch('?ordem=DROP_TABLE&pagina=-99');
    expect(sanitized.sortBy).toBe('RECOMENDADOS');
    expect(sanitized.page).toBe(1);
  });

  it('omite valores padrão ao serializar URL', () => {
    expect(
      serializeQueryToSearch({
        search: '',
        categorySlug: null,
        platformSlug: null,
        onlyTrending: false,
        sortBy: 'RECOMENDADOS',
        page: 1,
        pageSize: 20,
      }),
    ).toBe('');

    expect(
      serializeQueryToSearch({
        search: 'kindle',
        categorySlug: 'tecnologia',
        platformSlug: null,
        onlyTrending: true,
        sortBy: 'MAIOR_PRECO',
        page: 2,
        pageSize: 20,
      }),
    ).toBe('?q=kindle&categoria=tecnologia&destaque=1&ordem=MAIOR_PRECO&pagina=2');
  });
});
