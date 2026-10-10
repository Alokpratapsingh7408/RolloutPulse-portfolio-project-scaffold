import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type TableName = keyof Database['public']['Tables']

export type BatchDeviceWithDevice = Database['public']['Tables']['batch_devices']['Row'] & {
  devices: Pick<Database['public']['Tables']['devices']['Row'], 'serial' | 'model' | 'region'> | null
}

interface SupabaseQueryArgs {
  table: TableName
  method: 'select'
  match?: Record<string, string>
  /** Supabase select column/embed string, e.g. '*, devices(serial, model, region)'. Defaults to '*'. */
  columns?: string
}

const supabaseBaseQuery: BaseQueryFn<SupabaseQueryArgs, unknown, string> = async ({
  table,
  match,
  columns = '*',
}) => {
  let query = supabase.from(table).select(columns)
  if (match) {
    for (const [column, value] of Object.entries(match)) {
      query = query.eq(column, value)
    }
  }
  const { data, error } = await query
  if (error) return { error: error.message }
  return { data }
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: supabaseBaseQuery,
  tagTypes: ['Rollout', 'Batch', 'BatchDevice'],
  endpoints: (builder) => ({
    getRollouts: builder.query<Database['public']['Tables']['rollouts']['Row'][], void>({
      query: () => ({ table: 'rollouts', method: 'select' }),
      providesTags: ['Rollout'],
    }),
    getRolloutById: builder.query<Database['public']['Tables']['rollouts']['Row'] | undefined, string>({
      query: (rolloutId) => ({ table: 'rollouts', method: 'select', match: { id: rolloutId } }),
      transformResponse: (response: Database['public']['Tables']['rollouts']['Row'][]) => response[0],
      providesTags: ['Rollout'],
    }),
    getBatchesByRollout: builder.query<Database['public']['Tables']['batches']['Row'][], string>({
      query: (rolloutId) => ({ table: 'batches', method: 'select', match: { rollout_id: rolloutId } }),
      providesTags: ['Batch'],
    }),
    getBatchById: builder.query<Database['public']['Tables']['batches']['Row'] | undefined, string>({
      query: (batchId) => ({ table: 'batches', method: 'select', match: { id: batchId } }),
      transformResponse: (response: Database['public']['Tables']['batches']['Row'][]) => response[0],
      providesTags: ['Batch'],
    }),
    getBatchDevices: builder.query<BatchDeviceWithDevice[], string>({
      query: (batchId) => ({
        table: 'batch_devices',
        method: 'select',
        match: { batch_id: batchId },
        columns: '*, devices(serial, model, region)',
      }),
      providesTags: (_result, _error, batchId) => [{ type: 'BatchDevice', id: batchId }],
    }),
  }),
})

export const {
  useGetRolloutsQuery,
  useGetRolloutByIdQuery,
  useGetBatchesByRolloutQuery,
  useGetBatchByIdQuery,
  useGetBatchDevicesQuery,
} = api
