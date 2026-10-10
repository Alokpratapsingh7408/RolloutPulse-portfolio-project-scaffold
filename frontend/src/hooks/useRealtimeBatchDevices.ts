import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAppDispatch } from '../store/hooks'
import { api } from '../store/api'
import type { Database } from '../types/database'

type BatchDeviceRow = Database['public']['Tables']['batch_devices']['Row']

export function useRealtimeBatchDevices(batchId: string, onChange?: (row: BatchDeviceRow) => void) {
  const dispatch = useAppDispatch()

  // Keep the latest onChange in a ref so the subscription effect below only
  // ever needs to re-run when batchId/dispatch change, not on every render.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

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
          onChangeRef.current?.(updated)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [batchId, dispatch])
}
