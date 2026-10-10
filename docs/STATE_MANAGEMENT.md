# STATE_MANAGEMENT.md — State Management Strategy

## 1. Split: server cache vs. local UI state

- **Server data (rollouts, batches, devices)** → RTK Query. It's cache, not app state — don't duplicate it into a hand-written Redux slice.
- **Local-only UI state (selected status filter, search input, modal open/closed)** → plain `useState` in the component, or a tiny Redux slice only if it needs to be shared across distant components. Most of it won't.

Be able to say this split out loud — it's the actual signal that you understand *why* RTK Query exists, not just that you can import it.

## 2. RTK Query API slice

Supabase isn't a normal REST API, so the `baseQuery` wraps the Supabase client directly instead of using `fetchBaseQuery`:

```ts
// store/api.ts
export const api = createApi({
  reducerPath: 'api',
  baseQuery: supabaseBaseQuery,       // custom — see below
  tagTypes: ['Rollout', 'Batch', 'BatchDevice'],
  endpoints: (builder) => ({
    getRollouts: builder.query<Rollout[], void>({
      query: () => ({ table: 'rollouts', method: 'select' }),
      providesTags: ['Rollout'],
    }),
    getBatchesByRollout: builder.query<Batch[], string>({
      query: (rolloutId) => ({ table: 'batches', method: 'select', match: { rollout_id: rolloutId } }),
      providesTags: ['Batch'],
    }),
    getBatchDevices: builder.query<BatchDeviceRow[], string>({
      query: (batchId) => ({ table: 'batch_devices', method: 'select', match: { batch_id: batchId } }),
      providesTags: (_r, _e, batchId) => [{ type: 'BatchDevice', id: batchId }],
    }),
  }),
});
```

`supabaseBaseQuery` is a thin custom function that takes `{ table, method, match }`, runs the matching `supabase.from(table)...` call, and returns `{ data }` or `{ error }` in the shape RTK Query expects. This is a genuinely useful "I adapted RTK Query to a non-REST backend" talking point.

## 3. Realtime → cache patching

```ts
// hooks/useRealtimeBatchDevices.ts
export function useRealtimeBatchDevices(batchId: string) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const channel = supabase
      .channel(`batch-${batchId}`)
      .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'batch_devices', filter: `batch_id=eq.${batchId}` },
          (payload) => {
            dispatch(
              api.util.updateQueryData('getBatchDevices', batchId, (draft) => {
                const row = draft.find((d) => d.id === payload.new.id);
                if (row) row.status = payload.new.status;
              })
            );
          })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [batchId, dispatch]);
}
```

**Why `updateQueryData` and not just invalidating the tag and refetching:** a batch with 500 devices updating every few hundred milliseconds would otherwise trigger 500 full table refetches. Patching the single changed row is the correct, scalable approach — and explaining *why* is worth more in an interview than the code itself.

## 4. Burst handling (stretch, mention even if not fully implemented)

If many devices update within the same tick, batch the dispatches (e.g. buffer incoming payloads for ~100ms and apply them in one `updateQueryData` pass) rather than dispatching one Redux action per event. Documented here as a known next step even if day 9–10 only ships the simple per-event version — "I know this is the naive version, here's what I'd do under real load" is a strong interview answer on its own.

## 5. Loading / error / empty convention

Every query-consuming component follows the same three-way branch:

```ts
const { data, isLoading, isError } = useGetBatchDevicesQuery(batchId);
if (isLoading) return <Skeleton rows={8} />;
if (isError) return <EmptyState message="Couldn't load devices." />;
if (!data?.length) return <EmptyState message="No devices in this batch yet." />;
return <DataTable rows={data} ... />;
```
