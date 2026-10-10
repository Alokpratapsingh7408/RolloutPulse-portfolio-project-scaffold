import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAppDispatch } from '../store/hooks'
import { api } from '../store/api'
import type { Database } from '../types/database'

type BatchDeviceRow = Database['public']['Tables']['batch_devices']['Row']

export function useRealtimeBatchDevices(batchId: string) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const channel = supabase
      .channel(`batch-${batchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'batch_devices', filter: `batch_id=eq.${batchId}` },
        (payload) => {
          const updated = payload.new as BatchDeviceRow
          dispatch(
            api.util.updateQueryData('getBatchDevices', batchId, (draft) => {
              const row = draft.find((d) => d.id === updated.id)
              if (row) row.status = updated.status
            }),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [batchId, dispatch])
}
