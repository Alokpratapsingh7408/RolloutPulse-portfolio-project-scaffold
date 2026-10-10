import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type TableName = keyof Database['public']['Tables']

interface SupabaseQueryArgs {
  table: TableName
  method: 'select'
  match?: Record<string, string>
}

const supabaseBaseQuery: BaseQueryFn<SupabaseQueryArgs, unknown, string> = async ({
  table,
  match,
}) => {
  let query = supabase.from(table).select('*')
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
    getBatchesByRollout: builder.query<Database['public']['Tables']['batches']['Row'][], string>({
      query: (rolloutId) => ({ table: 'batches', method: 'select', match: { rollout_id: rolloutId } }),
      providesTags: ['Batch'],
    }),
    getBatchDevices: builder.query<Database['public']['Tables']['batch_devices']['Row'][], string>({
      query: (batchId) => ({ table: 'batch_devices', method: 'select', match: { batch_id: batchId } }),
      providesTags: (_result, _error, batchId) => [{ type: 'BatchDevice', id: batchId }],
    }),
  }),
})

export const { useGetRolloutsQuery, useGetBatchesByRolloutQuery, useGetBatchDevicesQuery } = api
