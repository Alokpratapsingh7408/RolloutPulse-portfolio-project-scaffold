// Simulates a progressive rollout walking through its batches live.
// Run with: npx tsx scripts/simulate-rollout.ts (from backend/), while the
// frontend is open on that rollout's batches to watch the realtime updates.
// This is a simulator standing in for a real device/agent reporting status
// back - see docs/BACKEND.md §5.
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randDelay(min = 100, max = 800): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    ;[copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function main() {
  const { data: rollout, error: rolloutError } = await supabase
    .from('rollouts')
    .select('id, name')
    .eq('status', 'active')
    .limit(1)
    .single();
  if (rolloutError || !rollout) {
    throw new Error(`No active rollout found: ${rolloutError?.message ?? 'none'}`);
  }
  console.log(`Simulating rollout: ${rollout.name}`);

  const { data: batches, error: batchesError } = await supabase
    .from('batches')
    .select('id, name, sequence_order')
    .eq('rollout_id', rollout.id)
    .order('sequence_order');
  if (batchesError || !batches) throw new Error(`Fetching batches failed: ${batchesError?.message}`);

  for (const batch of batches) {
    console.log(`\nBatch ${batch.sequence_order} (${batch.name}): starting`);
    await supabase
      .from('batches')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', batch.id);

    const { data: batchDevices, error: bdError } = await supabase
      .from('batch_devices')
      .select('id, status')
      .eq('batch_id', batch.id);
    if (bdError || !batchDevices) throw new Error(`Fetching batch_devices failed: ${bdError?.message}`);

    let successCount = 0;
    let failedCount = 0;

    for (const bd of shuffle(batchDevices)) {
      await sleep(randDelay());
      await supabase.from('batch_devices').update({ status: 'in_progress' }).eq('id', bd.id);

      await sleep(randDelay());
      const outcome: 'success' | 'failed' = Math.random() < 0.9 ? 'success' : 'failed';
      await supabase.from('batch_devices').update({ status: outcome }).eq('id', bd.id);
      await supabase.from('rollout_events').insert({
        batch_device_id: bd.id,
        old_status: 'in_progress',
        new_status: outcome,
      });

      if (outcome === 'success') successCount++;
      else failedCount++;

      await supabase
        .from('batches')
        .update({ success_count: successCount, failed_count: failedCount })
        .eq('id', batch.id);

      process.stdout.write(`\r  ${successCount + failedCount}/${batchDevices.length} (${successCount} ok, ${failedCount} failed)`);
    }

    await supabase
      .from('batches')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', batch.id);
    console.log(`\nBatch ${batch.sequence_order} (${batch.name}): completed`);
  }

  await supabase.from('rollouts').update({ status: 'completed' }).eq('id', rollout.id);
  console.log(`\nRollout "${rollout.name}" completed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
