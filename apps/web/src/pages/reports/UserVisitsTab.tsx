import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { adminBff } from '@/services/bff/admin.bff'
import { Card } from '@/components/ui/Card'
import { Loader2 } from 'lucide-react'

type UserVisitLog = {
  id: string
  user_name: string | null
  email: string | null
  source_type: string
  source_id: string
  vault_name: string | null
  property_name: string | null
  action: string
  visit_count: number
  last_visited_at: string | null
}

export default function UserVisitsTab() {
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'user-visits', page],
    queryFn: () => adminBff.getUserVisits(page, pageSize),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (isError) {
    return <div className="text-red-500 py-12 text-center">Failed to load user visits.</div>
  }

  const items = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">User Activity Logs</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Detailed view of user visits to vaults and opportunities.
        </p>
      </div>

      <Card className="overflow-hidden border border-[rgba(209,196,157,0.28)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--bg-surface-hover)] border-b border-[rgba(209,196,157,0.28)]">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-[var(--text-secondary)]">User Name</th>
                <th className="px-4 py-3.5 font-semibold text-[var(--text-secondary)]">No. of Times Seen</th>
                <th className="px-4 py-3.5 font-semibold text-[var(--text-secondary)]">Last Seen Date</th>
                <th className="px-4 py-3.5 font-semibold text-[var(--text-secondary)]">Vault Name</th>
                <th className="px-4 py-3.5 font-semibold text-[var(--text-secondary)]">Property Name</th>
                <th className="px-4 py-3.5 font-semibold text-[var(--text-secondary)]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(209,196,157,0.15)]">
              {items.length > 0 ? (
                items.map((row: UserVisitLog) => (
                  <tr key={row.id} className="hover:bg-[var(--bg-surface)] transition-colors">
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      <div>
                        <p className="font-medium text-sm text-[var(--text-primary)]">{row.user_name || 'Anonymous'}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{row.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      <span className="font-semibold">{row.visit_count}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      <span className="text-sm whitespace-nowrap">
                        {row.last_visited_at ? new Date(row.last_visited_at).toLocaleString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {row.vault_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {row.property_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10 capitalize">
                        {row.action}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-tertiary)]">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-surface-hover)] border-t border-[rgba(209,196,157,0.28)]">
          <span className="text-sm text-[var(--text-tertiary)]">
            Showing {Math.min((page - 1) * pageSize + 1, total)} to {Math.min(page * pageSize, total)} of {total} records
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-xs border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 text-xs border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
