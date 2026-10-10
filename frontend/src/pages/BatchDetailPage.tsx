import { useParams } from 'react-router-dom'

export function BatchDetailPage() {
  const { id } = useParams()
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Batch {id}</h1>
      <p className="text-gray-500">Device table coming on Day 8.</p>
    </main>
  )
}
