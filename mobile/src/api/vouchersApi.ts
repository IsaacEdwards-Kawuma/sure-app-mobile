import { baseApi } from './baseApi';

export interface Voucher {
  id: number;
  code: string;
  package_id: number | null;
  package_name: string | null;
  price: number | null;
  duration_minutes: number | null;
  status: 'unused' | 'sold';
  sold_at: string | null;
  created_at: string;
}

export interface GenerateVouchersInput {
  count: number;
  package_id?: number | null;
  package_name?: string;
  price?: number | null;
  duration_minutes?: number | null;
  code_prefix?: string;
}

export interface SellVouchersInput {
  voucher_ids?: number[];
  codes?: string[];
  sale_id?: number | null;
}

export const vouchersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    vouchers: build.query<{ vouchers: Voucher[] }, { status?: string } | void>({
      query: (params) => ({ url: 'vouchers', params: params || {} }),
      providesTags: (result) =>
        result
          ? [...result.vouchers.map((v) => ({ type: 'Vouchers' as const, id: v.id })), { type: 'Vouchers', id: 'LIST' }]
          : [{ type: 'Vouchers', id: 'LIST' }],
    }),
    generateVouchers: build.mutation<{ vouchers: Voucher[] }, GenerateVouchersInput>({
      query: (body) => ({ url: 'vouchers/batch', method: 'POST', body }),
      invalidatesTags: [{ type: 'Vouchers', id: 'LIST' }],
    }),
    sellVouchers: build.mutation<{ vouchers: Voucher[] }, SellVouchersInput>({
      query: (body) => ({ url: 'vouchers/sell', method: 'POST', body }),
      invalidatesTags: [{ type: 'Vouchers', id: 'LIST' }],
    }),
    deleteVoucher: build.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `vouchers/${id}`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [{ type: 'Vouchers', id }, { type: 'Vouchers', id: 'LIST' }],
    }),
  }),
});

export const {
  useVouchersQuery,
  useGenerateVouchersMutation,
  useSellVouchersMutation,
  useDeleteVoucherMutation,
} = vouchersApi;
