import { useState, useRef } from 'react'
import { Plus, Edit2, Trash2, Check, Loader2, Upload, Users, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToastStore } from '@/stores/toastStore'

interface FoundingTeamMember {
  id: string
  name: string
  title: string
  description: string
  previous_experience: string[]
  photo_url?: string
  sort_order: number
  is_active: boolean
}

export function FoundingTeamPanel() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  const { data: members, isLoading } = useQuery<FoundingTeamMember[]>({
    queryKey: ['admin-founding-team'],
    queryFn: async () => {
      const res = await api.get('/founding-team/admin')
      return res.data
    },
  })

  const createMember = useMutation({
    mutationFn: async (data: Partial<FoundingTeamMember>) => {
      const res = await api.post('/founding-team/admin', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-founding-team'] })
      addToast({ type: 'success', title: 'Member added', message: 'Founding team member created successfully.' })
      setEditing(null)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Error', message: 'Failed to create member.' })
    }
  })

  const updateMember = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FoundingTeamMember> }) => {
      const res = await api.patch(`/founding-team/admin/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-founding-team'] })
      addToast({ type: 'success', title: 'Member updated', message: 'Founding team member updated successfully.' })
      setEditing(null)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Error', message: 'Failed to update member.' })
    }
  })

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/founding-team/admin/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-founding-team'] })
      addToast({ type: 'success', title: 'Member deleted', message: 'Founding team member removed.' })
    },
    onError: () => {
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete member.' })
    }
  })

  const uploadPhoto = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post(`/founding-team/admin/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-founding-team'] })
      addToast({ type: 'success', title: 'Photo uploaded', message: 'Member photo updated successfully.' })
    },
    onError: () => {
      addToast({ type: 'error', title: 'Error', message: 'Failed to upload photo.' })
    }
  })

  const [editing, setEditing] = useState<Partial<FoundingTeamMember> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const handleSave = () => {
    if (!editing?.name || !editing?.title || !editing?.description) {
      addToast({ type: 'error', title: 'Validation', message: 'Name, title, and description are required.' })
      return
    }

    if (editing.id) {
      updateMember.mutate({ id: editing.id, data: editing })
    } else {
      createMember.mutate(editing)
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, memberId: string) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadingId(memberId)
      uploadPhoto.mutate({ id: memberId, file }, {
        onSettled: () => setUploadingId(null)
      })
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-theme-tertiary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-theme-tertiary" />
          <p className="text-xs text-theme-secondary">
            Manage the founding team members displayed on the About page.
          </p>
        </div>
        <button
          onClick={() => setEditing({ name: '', title: '', description: '', previous_experience: [], sort_order: 0, is_active: true })}
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <Plus className="h-4 w-4" /> Add Member
        </button>
      </div>

      <div className="grid gap-4">
        {members?.map((member) => (
          <div key={member.id} className="bg-[var(--bg-card)] rounded-xl border border-theme/60 p-4 flex gap-4">
            <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-theme-surface shrink-0 border border-theme flex items-center justify-center group">
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <Users className="h-8 w-8 text-theme-tertiary" />
              )}
              <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                {uploadingId === member.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 mb-1" />}
                <span className="text-[10px] font-semibold">{uploadingId === member.id ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handlePhotoSelect(e, member.id)}
                />
              </label>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-theme-primary">{member.name}</h4>
                  <p className="text-xs font-medium text-primary mt-0.5">{member.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${member.is_active ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-theme-surface-hover text-theme-tertiary'}`}>
                    {member.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <button onClick={() => setEditing(member)} className="p-1.5 rounded-lg border border-theme hover:bg-theme-surface text-theme-tertiary hover:text-theme-secondary transition-colors">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { if(confirm('Delete member?')) deleteMember.mutate(member.id) }} className="p-1.5 rounded-lg border border-theme hover:bg-red-50 text-theme-tertiary hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-theme-secondary mt-2 line-clamp-2">{member.description}</p>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg border border-theme shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-theme bg-theme-surface/30">
              <h3 className="font-display font-semibold text-theme-primary">{editing.id ? 'Edit Member' : 'Add Member'}</h3>
              <button onClick={() => setEditing(null)} className="p-2 -mr-2 text-theme-tertiary hover:text-theme-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-theme-secondary mb-1">Full Name</label>
                <input
                  type="text"
                  value={editing.name || ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full rounded-xl border border-theme bg-theme-surface px-4 py-2.5 text-sm text-theme-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-theme-secondary mb-1">Title</label>
                <input
                  type="text"
                  value={editing.title || ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full rounded-xl border border-theme bg-theme-surface px-4 py-2.5 text-sm text-theme-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. Founder & CEO"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-theme-secondary mb-1">Description</label>
                <textarea
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full rounded-xl border border-theme bg-theme-surface px-4 py-2.5 text-sm text-theme-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[100px]"
                  placeholder="Brief biography..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-theme-secondary mb-1">Previous Experience (Comma separated)</label>
                <input
                  type="text"
                  value={editing.previous_experience?.join(', ') || ''}
                  onChange={(e) => setEditing({ ...editing, previous_experience: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full rounded-xl border border-theme bg-theme-surface px-4 py-2.5 text-sm text-theme-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. Ex-Google, Ex-McKinsey"
                />
              </div>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_active ?? true}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                    className="rounded border-theme text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-theme-primary">Active (Visible)</span>
                </label>
                <div className="flex-1" />
                <label className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-theme-secondary">Sort Order</span>
                  <input
                    type="number"
                    value={editing.sort_order || 0}
                    onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-20 rounded-lg border border-theme bg-theme-surface px-3 py-1.5 text-sm text-theme-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-theme bg-theme-surface/30 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl font-semibold text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-surface transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={createMember.isPending || updateMember.isPending}
                className="btn-primary inline-flex items-center gap-2 text-sm px-6 py-2.5"
              >
                {(createMember.isPending || updateMember.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
