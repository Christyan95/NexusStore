import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '@/core/errors/app-error';
import { err } from '@/core/errors/result';
import type { CatalogRepositoryPort } from '../../application/catalog-repository.port';
import { ListCatalogUseCase } from '../../application/list-catalog.usecase';
import { DevFixtureCatalogRepository } from '../../infrastructure/dev-fixture.repository';
import { StorefrontPage } from './StorefrontPage';

function renderStorefront(useCase: ListCatalogUseCase) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StorefrontPage useCase={useCase} />
    </QueryClientProvider>,
  );
}

describe('StorefrontPage integration', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('renderiza ofertas verificadas sem dark patterns e permite limpar todos os filtros do estado vazio', async () => {
    const user = userEvent.setup();
    const useCase = new ListCatalogUseCase(new DevFixtureCatalogRepository(), null);

    renderStorefront(useCase);

    expect(await screen.findByText(/Apple AirPods Pro \(2ª Geração\)/i)).toBeInTheDocument();

    // Garante que não há notificação falsa de compra
    expect(screen.queryByText(/Alguém de/i)).not.toBeInTheDocument();

    // Ativa filtro combinado sem resultados (Shopee + Em Alta)
    await user.click(screen.getByRole('button', { name: 'Shopee' }));
    await user.click(screen.getByRole('button', { name: /Em Alta/i }));

    expect(await screen.findByText(/Nenhuma oferta encontrada/i)).toBeInTheDocument();

    // Limpar todos os filtros deve restaurar o catálogo completo (corrigindo bug do legado)
    await user.click(screen.getByRole('button', { name: /Limpar todos os filtros/i }));

    await waitFor(() => {
      expect(screen.getByText(/Apple AirPods Pro \(2ª Geração\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Kindle 11ª Geração/i)).toBeInTheDocument();
    });
  });

  it('exibe estado de erro seguro sem vazar detalhes internos de banco ou RLS', async () => {
    const failingRepo: CatalogRepositoryPort = {
      listProducts: () =>
        Promise.resolve(
          err(
            new AppError({
              code: 'UPSTREAM_ERROR',
              message: 'relation public.my_prod permission denied for RLS',
              userMessage:
                'Não foi possível carregar o catálogo de ofertas agora. Tente novamente em instantes.',
              requestId: 'req_test1234',
              retryable: true,
            }),
          ),
        ),
      listFacets: () =>
        Promise.resolve(
          err(
            new AppError({
              code: 'UPSTREAM_ERROR',
              message: 'facets error',
              userMessage: 'Erro ao carregar filtros.',
              requestId: 'req_facets12',
              retryable: false,
            }),
          ),
        ),
    };

    renderStorefront(new ListCatalogUseCase(failingRepo, null));

    expect(await screen.findByText(/Indisponibilidade temporária/i)).toBeInTheDocument();
    expect(screen.getByText(/req_test1234/i)).toBeInTheDocument();
    expect(screen.queryByText(/my_prod/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/RLS/i)).not.toBeInTheDocument();
  });
});
