import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Search, SlidersHorizontal, UserPlus, LayoutGrid,
  List, Download, Mail, Users,
} from 'lucide-react'
import api from '@/lib/api'
import { formatDate, getMemberStatusColor, getMemberStatusLabel, getInitials, cn } from '@/lib/utils'

type ViewMode = 'card' | 'table'

function MemberCard({ member }: { member: any }) {
  const status = member.status
  const activePlan = member.member_plans?.[0]
  const lastCheckin = member.attendance?.[0]
  const dues = activePlan ? (activePlan.plan?.price || 0) - (activePlan.discount_applied || 0) - (activePlan.amount_paid || 0) : 0;

  return (
    <Link
      to={`/members/${member.id}`}
      className="card-hover flex flex-col gap-3 animate-fade-in"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {member.profile_photo_url ? (
            <img src={member.profile_photo_url} alt={member.user?.name} className="w-11 h-11 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {getInitials(member.user?.name ?? 'NA')}
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-800 text-sm leading-tight">{member.user?.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{member.member_code}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn('badge', getMemberStatusColor(status))}>
            {getMemberStatusLabel(status)}
          </span>
          {dues > 0 && (
            <span className="badge bg-danger/10 text-danger border-danger/20 font-bold">
              Due: ₹{dues.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <span>Plan</span>
          <span className="font-medium text-slate-700">{activePlan?.plan?.name ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Expires</span>
          <span className={cn('font-medium', status === 'expired' ? 'text-danger' : 'text-slate-700')}>
            {activePlan ? formatDate(activePlan.end_date) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Last check-in</span>
          <span className="font-medium text-slate-700">{lastCheckin ? formatDate(lastCheckin.checked_in_at) : 'Never'}</span>
        </div>
        {member.trainer_relations?.[0] && (
          <div className="flex items-center justify-between">
            <span>Trainer</span>
            <span className="font-medium text-slate-700">{member.trainer_relations[0].trainer.name}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

function MemberTableRow({ member }: { member: any }) {
  const status = member.status
  const activePlan = member.member_plans?.[0]
  const lastCheckin = member.attendance?.[0]
  const dues = activePlan ? (activePlan.plan?.price || 0) - (activePlan.discount_applied || 0) - (activePlan.amount_paid || 0) : 0;

  return (
    <tr>
      <td>
        <Link to={`/members/${member.id}`} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(member.user?.name ?? 'NA')}
          </div>
          <div>
            <p className="font-medium text-slate-800 group-hover:text-primary-700 text-sm">{member.user?.name}</p>
            <p className="text-xs text-slate-400">{member.member_code}</p>
          </div>
        </Link>
      </td>
      <td className="text-slate-600 text-sm">{member.user?.phone ?? '—'}</td>
      <td>
        <span className={cn('badge', getMemberStatusColor(status))}>{getMemberStatusLabel(status)}</span>
      </td>
      <td className="text-sm text-slate-600">
        <div>{activePlan?.plan?.name ?? '—'}</div>
        {dues > 0 && <div className="text-xs font-bold text-danger mt-0.5">Due: ₹{dues.toLocaleString('en-IN')}</div>}
      </td>
      <td className="text-sm text-slate-600">{activePlan ? formatDate(activePlan.end_date) : '—'}</td>
      <td className="text-sm text-slate-500">{lastCheckin ? formatDate(lastCheckin.checked_in_at) : 'Never'}</td>
      <td>
        <Link to={`/members/${member.id}`} className="text-xs text-primary-700 hover:underline font-medium">View →</Link>
      </td>
    </tr>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4 animate-pulse">
          <div className="skeleton w-11 h-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
      ))}
    </>
  )
}

export default function MembersPage() {
  const [view, setView] = useState<ViewMode>('card')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['members', search, statusFilter, page],
    queryFn: () =>
      api.get('/members', {
        params: { search: search || undefined, status: statusFilter || undefined, page, limit: 20 },
      }).then(r => r.data),
    keepPreviousData: true,
  } as any)

  const members = data?.data ?? []
  const meta = data?.meta ?? {}

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">{meta.total ?? '—'} total members</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline btn-sm hidden md:flex">
            <Download className="w-4 h-4" /> Export
          </button>
          <Link to="/members/new" className="btn-primary btn-sm">
            <UserPlus className="w-4 h-4" /> Add Member
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="search-input"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="input w-auto"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
          <option value="archived">Archived</option>
        </select>

        <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView('card')}
            className={cn('btn-icon btn-sm', view === 'card' ? 'bg-white shadow-sm text-primary-700' : 'text-slate-400 hover:text-slate-700')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('table')}
            className={cn('btn-icon btn-sm', view === 'table' ? 'bg-white shadow-sm text-primary-700' : 'text-slate-400 hover:text-slate-700')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        view === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <SkeletonRows />
          </div>
        ) : (
          <div className="card space-y-3"><SkeletonRows /></div>
        )
      ) : members.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-display font-semibold text-slate-700 text-lg mb-2">No members found</h3>
          <p className="text-slate-400 text-sm mb-5 max-w-xs">
            {search || statusFilter ? 'Try adjusting your filters.' : 'Add your first member to get started.'}
          </p>
          {!search && !statusFilter && (
            <Link to="/members/new" className="btn-primary">
              <UserPlus className="w-4 h-4" /> Add First Member
            </Link>
          )}
        </div>
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.map((m: any) => <MemberCard key={m.id} member={m} />)}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Expires</th>
                <th>Last Check-in</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: any) => <MemberTableRow key={m.id} member={m} />)}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.total > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, meta.total)} of {meta.total} members
          </p>
          <div className="flex gap-2">
            <button
              className="btn-outline btn-sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <button
              className="btn-outline btn-sm"
              disabled={!meta.hasMore}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
