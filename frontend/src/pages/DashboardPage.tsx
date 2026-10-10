import { Link } from 'react-router-dom'
import { useGetRolloutsQuery } from '../store/api'
import { supabase } from '../lib/supabase'

export function DashboardPage() {
  const { data: rollouts, isLoading, isError } = useGetRolloutsQuery()

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Rollouts</h1>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Sign out
        </button>
      </div>

      {isLoading && <p>Loading...</p>}
      {isError && <p className="text-status-failed">Couldn't load rollouts.</p>}
      {!isLoading && !isError && rollouts?.length === 0 && <p>No rollouts yet.</p>}

      <ul className="space-y-2">
        {rollouts?.map((rollout) => (
          <li key={rollout.id}>
            <Link
              to={`/rollouts/${rollout.id}`}
              className="block rounded border border-gray-200 p-3 hover:bg-gray-50"
            >
              <span className="font-medium">{rollout.name}</span>{' '}
              <span className="text-sm text-gray-500">({rollout.status})</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
