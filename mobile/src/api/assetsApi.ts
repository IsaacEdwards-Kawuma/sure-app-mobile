import { baseApi } from './baseApi';

export interface Asset {
  id: number;
  name: string;
  category: string | null;
  value: number | null;
  source: string | null;
  status: string | null;
  date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetInput {
  name: string;
  category?: string | null;
  value?: number | null;
  source?: string | null;
  status?: string | null;
  date?: string | null;
}

export const assetsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    assets: build.query<{ assets: Asset[] }, void>({
      query: () => ({ url: 'assets' }),
      providesTags: (result) =>
        result
          ? [...result.assets.map((a) => ({ type: 'Assets' as const, id: a.id })), { type: 'Assets', id: 'LIST' }]
          : [{ type: 'Assets', id: 'LIST' }],
    }),
    asset: build.query<{ asset: Asset }, number>({
      query: (id) => ({ url: `assets/${id}` }),
      providesTags: (_, __, id) => [{ type: 'Assets', id }],
    }),
    createAsset: build.mutation<{ asset: Asset }, CreateAssetInput>({
      query: (body) => ({ url: 'assets', method: 'POST', body }),
      invalidatesTags: [{ type: 'Assets', id: 'LIST' }],
    }),
    updateAsset: build.mutation<{ asset: Asset }, { id: number; body: Partial<CreateAssetInput> }>({
      query: ({ id, body }) => ({ url: `assets/${id}`, method: 'PUT', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Assets', id }, { type: 'Assets', id: 'LIST' }],
    }),
    deleteAsset: build.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `assets/${id}`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [{ type: 'Assets', id }, { type: 'Assets', id: 'LIST' }],
    }),
  }),
});

export const {
  useAssetsQuery,
  useAssetQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
} = assetsApi;
