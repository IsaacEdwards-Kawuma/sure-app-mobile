import { baseApi } from './baseApi';

export interface Expense {
  id: number;
  sale_id: number | null;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  sale_id?: number | null;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  amount: number;
}

export const expensesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    expenses: build.query<{ expenses: Expense[] }, { sale_id?: string; category?: string } | void>({
      query: (params) => ({ url: 'expenses', params: params || {} }),
      providesTags: (result) =>
        result
          ? [...result.expenses.map((e) => ({ type: 'Expenses' as const, id: e.id })), { type: 'Expenses', id: 'LIST' }]
          : [{ type: 'Expenses', id: 'LIST' }],
    }),
    expense: build.query<{ expense: Expense }, number>({
      query: (id) => ({ url: `expenses/${id}` }),
      providesTags: (_, __, id) => [{ type: 'Expenses', id }],
    }),
    createExpense: build.mutation<{ expense: Expense }, CreateExpenseInput>({
      query: (body) => ({ url: 'expenses', method: 'POST', body }),
      invalidatesTags: [{ type: 'Expenses', id: 'LIST' }],
    }),
    updateExpense: build.mutation<{ expense: Expense }, { id: number; body: Partial<CreateExpenseInput> }>({
      query: ({ id, body }) => ({ url: `expenses/${id}`, method: 'PUT', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Expenses', id }, { type: 'Expenses', id: 'LIST' }],
    }),
    deleteExpense: build.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `expenses/${id}`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [{ type: 'Expenses', id }, { type: 'Expenses', id: 'LIST' }],
    }),
  }),
});

export const {
  useExpensesQuery,
  useExpenseQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expensesApi;
