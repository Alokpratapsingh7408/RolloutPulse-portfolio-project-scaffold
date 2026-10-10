// Seeds the RolloutPulse database per docs/BACKEND.md §4.
// Run with: npx tsx scripts/seed.ts (from backend/)
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

const TEST_USER_EMAIL = 'admin@rolloutpulse.test';
const TEST_USER_PASSWORD = 'RolloutPulse123!';

const DEVICE_COUNT = 500;
const MODELS = ['ECU-X1', 'ECU-X2', 'TCU-100', 'TCU-200', 'Gateway-A'];
const REGIONS = ['north', 'south', 'east', 'west'];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function insertInChunks<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  chunkSize = 500,
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw new Error(`Insert into ${table} failed: ${error.message}`);
  }
}

async function ensureTestUser(): Promise<string> {
  const { data: existing, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw new Error(`listUsers failed: ${listError.message}`);
  const found = existing.users.find((u) => u.email === TEST_USER_EMAIL);
  if (found) {
    console.log(`Test user already exists: ${TEST_USER_EMAIL}`);
    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
  console.log(`Created test user: ${TEST_USER_EMAIL}`);
  return data.user.id;
}

async function ensureProfile(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, full_name: 'Test Admin', role: 'admin' }, { onConflict: 'id' });
  if (error) throw new Error(`profiles upsert failed: ${error.message}`);
}

async function main() {
  const userId = await ensureTestUser();
  await ensureProfile(userId);

  console.log(`Seeding ${DEVICE_COUNT} devices...`);
  const devices = Array.from({ length: DEVICE_COUNT }, (_, i) => ({
    serial: `DEV-${String(i + 1).padStart(5, '0')}`,
    model: MODELS[randInt(0, MODELS.length - 1)],
    region: REGIONS[randInt(0, REGIONS.length - 1)],
  }));
  await insertInChunks('devices', devices);

  const { data: deviceRows, error: deviceFetchError } = await supabase
    .from('devices')
    .select('id')
    .order('serial');
  if (deviceFetchError || !deviceRows) {
    throw new Error(`Fetching seeded devices failed: ${deviceFetchError?.message}`);
  }
  const deviceIds = deviceRows.map((d) => d.id as string);

  const rolloutSpecs: Array<{ name: string; description: string; status: string }> = [
    { name: 'Infotainment v4.2 Rollout', description: 'Progressive rollout of infotainment firmware v4.2.', status: 'active' },
    { name: 'Telematics v2.0 Rollout', description: 'Telematics control unit firmware v2.0.', status: 'completed' },
    { name: 'Gateway Security Patch', description: 'Security patch for the gateway module, planning stage.', status: 'draft' },
  ];

  for (const spec of rolloutSpecs) {
    console.log(`Seeding rollout: ${spec.name} (${spec.status})`);
    const { data: rollout, error: rolloutError } = await supabase
      .from('rollouts')
      .insert({ ...spec, created_by: userId })
      .select('id')
      .single();
    if (rolloutError || !rollout) throw new Error(`rollout insert failed: ${rolloutError?.message}`);

    const batchCount = randInt(4, 6);
    for (let seq = 1; seq <= batchCount; seq++) {
      const assignedDeviceIds = shuffle(deviceIds).slice(0, randInt(50, DEVICE_COUNT));

      const { data: batch, error: batchError } = await supabase
        .from('batches')
        .insert({
          rollout_id: rollout.id,
          name: `Batch ${seq} - ${REGIONS[randInt(0, REGIONS.length - 1)]}`,
          sequence_order: seq,
          target_count: assignedDeviceIds.length,
        })
        .select('id')
        .single();
      if (batchError || !batch) throw new Error(`batch insert failed: ${batchError?.message}`);

      const batchDevices = assignedDeviceIds.map((deviceId) => ({
        batch_id: batch.id,
        device_id: deviceId,
      }));
      await insertInChunks('batch_devices', batchDevices);
      console.log(`  Batch ${seq}: ${assignedDeviceIds.length} devices`);
    }
  }

  console.log('Seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
