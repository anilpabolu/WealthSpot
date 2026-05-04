import { useState } from 'react'
import { Plus, Loader2, GripVertical, Edit3, Check, X, Trash2 } from 'lucide-react'
import { Select, Toggle } from '@/components/ui'
import { useOpportunities } from '@/hooks/useOpportunities'
import {
  useBuilderQuestions,
  useCreateBuilderQuestion,
  useUpdateBuilderQuestion,
  useDeleteBuilderQuestion,
  type BuilderQuestion,
} from '@/hooks/useEOI'
import { CenteredLoader } from './shared'

export default function BuilderQuestionsTab() {
  const [selectedOppId, setSelectedOppId] = useState('')
  const { data: oppsData } = useOpportunities({ vaultType: '', status: '' })
  const opps = oppsData?.items ?? []
  const { data: questions = [], isLoading } = useBuilderQuestions(selectedOppId)
  const createQ = useCreateBuilderQuestion()
  const updateQ = useUpdateBuilderQuestion()
  const deleteQ = useDeleteBuilderQuestion()

  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState('text')
  const [newOptions, setNewOptions] = useState('')
  const [newRequired, setNewRequired] = useState(false)

  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const handleCreate = async () => {
    if (!selectedOppId || !newText.trim()) return
    const opts = newType === 'select' && newOptions.trim()
      ? { choices: newOptions.split(',').map(s => s.trim()).filter(Boolean) }
      : undefined
    await createQ.mutateAsync({
      opportunityId: selectedOppId,
      questionText: newText.trim(),
      questionType: newType,
      options: opts,
      isRequired: newRequired,
      sortOrder: questions.length,
    })
    setNewText('')
    setNewOptions('')
    setNewRequired(false)
  }

  const handleSaveEdit = async (q: BuilderQuestion) => {
    if (!editText.trim()) return
    await updateQ.mutateAsync({
      opportunityId: q.opportunityId,
      questionId: q.id,
      data: { questionText: editText.trim() },
    })
    setEditId(null)
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-theme-primary">Builder Questions</h2>
      <p className="text-sm text-theme-secondary">Manage custom questions that builders can ask investors when they express interest.</p>

      <Select
        value={selectedOppId}
        onChange={setSelectedOppId}
        placeholder="Select an Opportunity"
        options={opps.map((o) => ({ value: o.id, label: o.title }))}
        searchable
        className="max-w-md"
      />

      {selectedOppId && (
        <>
          <div className="bg-[var(--bg-card)] backdrop-blur-sm rounded-xl border border-theme/60 p-4 space-y-3">
            <p className="text-xs font-semibold text-theme-secondary uppercase">Add Question</p>
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Question text…"
              className="w-full rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary outline-none"
            />
            <div className="flex flex-wrap gap-3">
              <Select value={newType} onChange={setNewType} options={[
                { value: 'text', label: 'Text' },
                { value: 'number', label: 'Number' },
                { value: 'select', label: 'Select (dropdown)' },
                { value: 'boolean', label: 'Yes / No' },
              ]} size="sm" />
              {newType === 'select' && (
                <input
                  value={newOptions}
                  onChange={(e) => setNewOptions(e.target.value)}
                  placeholder="Option1, Option2, Option3"
                  className="flex-1 rounded-lg border border-theme px-3 py-2 text-sm focus:border-primary outline-none"
                />
              )}
              <Toggle checked={newRequired} onChange={setNewRequired} label="Required" size="sm" />
              <button onClick={handleCreate} disabled={createQ.isPending || !newText.trim()} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-50">
                {createQ.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </button>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] backdrop-blur-xl rounded-xl border border-theme/60 overflow-hidden">
            {isLoading ? (
              <CenteredLoader />
            ) : questions.length === 0 ? (
              <p className="text-sm text-theme-tertiary text-center py-8">No questions added yet.</p>
            ) : (
              <ul className="divide-y divide-theme">
                {questions.map((q: BuilderQuestion) => (
                  <li key={q.id} className="flex items-center gap-3 px-4 py-3 hover:bg-theme-surface/50">
                    <GripVertical className="h-4 w-4 text-theme-tertiary shrink-0" />
                    <div className="flex-1 min-w-0">
                      {editId === q.id ? (
                        <div className="flex items-center gap-2">
                          <input value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 rounded border border-theme px-2 py-1 text-sm focus:border-primary outline-none" />
                          <button onClick={() => handleSaveEdit(q)} className="text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditId(null)} className="text-theme-tertiary hover:text-theme-secondary"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <p className="text-sm text-theme-primary truncate">{q.questionText}</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase font-semibold text-theme-tertiary tracking-wider">{q.questionType}</span>
                        {q.isRequired && <span className="text-[10px] font-semibold text-red-400">Required</span>}
                      </div>
                    </div>
                    <button onClick={() => { setEditId(q.id); setEditText(q.questionText) }} className="text-theme-tertiary hover:text-primary"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => deleteQ.mutate({ opportunityId: q.opportunityId, questionId: q.id })} className="text-theme-tertiary hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
