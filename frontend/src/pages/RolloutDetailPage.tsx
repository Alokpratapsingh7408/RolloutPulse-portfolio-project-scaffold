import { useParams } from 'react-router-dom'

export function RolloutDetailPage() {
  const { id } = useParams()
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Rollout {id}</h1>
      <p className="text-gray-500">Batch list coming on Day 7.</p>
    </main>
  )
}
