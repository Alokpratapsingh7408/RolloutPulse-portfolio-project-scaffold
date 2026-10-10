import { configureStore } from '@reduxjs/toolkit'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { api } from '../store/api'
import { useRealtimeBatchDevices } from './useRealtimeBatchDevices'

// Mock the Supabase channel so we can fire a synthetic postgres_changes
// payload ourselves instead of needing a real realtime connection.
type ChangeCallback = (payload: { new: Record<string, unknown> }) => void
let capturedCallback: ChangeCallback | null = null

interface MockChannel {
  on: jest.Mock
  subscribe: jest.Mock
}

const mockChannel: MockChannel = {
  on: jest.fn((_event: string, _filter: unknown, callback: ChangeCallback) => {
    capturedCallback = callback
    return mockChannel
  }),
  subscribe: jest.fn(() => mockChannel),
}

jest.mock('../lib/supabase', () => ({
  supabase: {
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn(),
  },
}))

const BATCH_ID = 'batch-1'
const BATCH_DEVICE_ID = 'bd-1'

function makeStore() {
  return configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  })
}

describe('useRealtimeBatchDevices', () => {
  it('patches the RTK Query cache in place when a postgres_changes event arrives (no refetch)', async () => {
    const store = makeStore()
    await store.dispatch(
      api.util.upsertQueryData('getBatchDevices', BATCH_ID, [
        {
          id: BATCH_DEVICE_ID,
          batch_id: BATCH_ID,
          device_id: 'device-1',
          status: 'pending',
          updated_at: '2026-01-01T00:00:00Z',
          devices: { serial: 'DEV-00001', model: 'ECU-X1', region: 'north' },
        },
      ]),
    )

    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
    renderHook(() => useRealtimeBatchDevices(BATCH_ID), { wrapper })

    expect(capturedCallback).not.toBeNull()

    // Simulate the realtime UPDATE payload Supabase would send
    capturedCallback!({ new: { id: BATCH_DEVICE_ID, batch_id: BATCH_ID, status: 'success' } })

    const result = api.endpoints.getBatchDevices.select(BATCH_ID)(store.getState())
    expect(result.data?.[0].status).toBe('success')
    // The embedded device data is untouched - only status was patched
    expect(result.data?.[0].devices?.serial).toBe('DEV-00001')
  })
})
