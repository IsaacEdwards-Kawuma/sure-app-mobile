import { baseApi } from './baseApi';

export interface Sale {
  id: number;
  date: string;
  week?: string;
  attendant_id: number | null;
  attendant_name?: string;
  total_revenue: number;
  revenue_sources: string;
  notes: string | null;
  downtime: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSaleInput {
  date: string;
  attendant_id?: number | null;
  total_revenue?: number;
  revenue_sources?: Record<string, number>;
  notes?: string | null;
  downtime?: number;
}

export const salesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    sales: build.query<{ sales: Sale[] }, { limit?: number } | void>({
      query: (arg) => ({ url: 'sales', params: arg?.limit ? { limit: arg.limit } : undefined }),
      providesTags: (result) =>
        result ? [...result.sales.map((s) => ({ type: 'Sales' as const, id: s.id })), { type: 'Sales', id: 'LIST' }] : [{ type: 'Sales', id: 'LIST' }],
    }),
    sale: build.query<{ sale: Sale }, number>({
      query: (id) => ({ url: `sales/${id}` }),
      providesTags: (_, __, id) => [{ type: 'Sales', id }],
    }),
    createSale: build.mutation<{ sale: Sale }, CreateSaleInput>({
      query: (body) => ({ url: 'sales', method: 'POST', body }),
      invalidatesTags: [{ type: 'Sales', id: 'LIST' }],
    }),
    updateSale: build.mutation<{ sale: Sale }, { id: number; body: Partial<CreateSaleInput> & { reason?: string } }>({
      query: ({ id, body }) => ({ url: `sales/${id}`, method: 'PUT', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Sales', id }, { type: 'Sales', id: 'LIST' }],
    }),
    deleteSale: build.mutation<{ ok: boolean }, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({ url: `sales/${id}`, method: 'DELETE', body: { reason } }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Sales', id }, { type: 'Sales', id: 'LIST' }],
    }),
  }),
});

export const {
  useSalesQuery,
  useSaleQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
} = salesApi;
