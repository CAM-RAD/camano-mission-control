import { useState, useEffect, useCallback } from 'react'
import {
  isSupabaseConfigured,
  getTeamMembers,
  findOrCreateTeamMember,
  deleteTeamMember,
  getImports,
  getCurrentImports,
  createImport,
  restoreImport,
  deleteImport,
  getActivities,
  getProspects,
  getTeamStats
} from './lib/supabase'

// App version
const APP_VERSION = '1.0.3'
const BUILD_DATE = '2026-01-16'

// Pixel art icon component
const PixelIcon = ({ name, size = 24, className = '' }) => (
  <img
    src={`https://cdn.jsdelivr.net/npm/pixelarticons/svg/${name}.svg`}
    width={size}
    height={size}
    alt={name}
    className={className}
    style={{ imageRendering: 'pixelated' }}
  />
)

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0)
}

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// ============ SETUP SCREEN ============
function SetupScreen() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <PixelIcon name="server" size={64} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Setup Required
          </h1>
        </div>

        <div className="space-y-4 text-slate-600">
          <p>To use Mission Control, you need to set up a Supabase database:</p>

          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">supabase.com</a> and create a free account</li>
            <li>Create a new project</li>
            <li>Go to SQL Editor and run the schema (see docs)</li>
            <li>Go to Settings &gt; API and copy your project URL and anon key</li>
            <li>Create a <code className="bg-slate-100 px-1 rounded">.env.local</code> file with:
              <pre className="bg-slate-800 text-green-400 p-3 rounded mt-2 text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here`}
              </pre>
            </li>
            <li>Restart the dev server</li>
          </ol>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm">
            <strong>Note:</strong> The database schema SQL is in the project documentation.
          </p>
        </div>
      </div>
    </div>
  )
}

// ============ TEAM DASHBOARD ============
function TeamDashboard({ teamMembers, currentImports, stats, onRefresh }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Team Dashboard
        </h2>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm"
        >
          <PixelIcon name="reload" size={16} />
          Refresh
        </button>
      </div>

      {/* Team Totals */}
      {stats && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-sm font-bold text-slate-500 mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            TEAM TOTALS THIS WEEK
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <PixelIcon name="mail" size={24} className="mx-auto mb-1" />
              <div className="text-2xl font-bold text-slate-800">{stats.emails}</div>
              <div className="text-xs text-slate-500">Emails</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <PixelIcon name="headset" size={24} className="mx-auto mb-1" />
              <div className="text-2xl font-bold text-slate-800">{stats.calls}</div>
              <div className="text-xs text-slate-500">Calls</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <PixelIcon name="users" size={24} className="mx-auto mb-1" />
              <div className="text-2xl font-bold text-slate-800">{stats.meetings}</div>
              <div className="text-xs text-slate-500">Meetings</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <PixelIcon name="notes" size={24} className="mx-auto mb-1" />
              <div className="text-2xl font-bold text-slate-800">{stats.proposals}</div>
              <div className="text-xs text-slate-500">Proposals</div>
            </div>
          </div>

          {/* Won Stats */}
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
            <div>
              <div className="text-sm text-green-700 font-medium">Won This Week</div>
              <div className="text-2xl font-bold text-green-800">{stats.wonDeals} deals</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-700 font-medium">Revenue</div>
              <div className="text-2xl font-bold text-green-800">{formatCurrency(stats.wonRevenue)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Team Member Cards */}
      <div className="grid gap-4">
        {currentImports.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-slate-500">
            <PixelIcon name="file-plus" size={48} className="mx-auto mb-4 opacity-50" />
            <p>No data imported yet.</p>
            <p className="text-sm mt-2">Go to Import tab to upload team member JSON files.</p>
          </div>
        ) : (
          currentImports.map(imp => (
            <MemberCard key={imp.id} import_data={imp} />
          ))
        )}
      </div>
    </div>
  )
}

// ============ MEMBER CARD ============
function MemberCard({ import_data }) {
  const counts = import_data.activity_count || {}
  const targets = import_data.targets || { emails: 50, calls: 50, meetings: 10, proposals: 5 }

  const getProgressColor = (current, target) => {
    const pct = target > 0 ? (current / target) * 100 : 0
    if (pct >= 100) return 'bg-green-500'
    if (pct >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getProgressPct = (current, target) => {
    return target > 0 ? Math.min(100, (current / target) * 100) : 0
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {import_data.team_members?.name || 'Unknown'}
          </h3>
          <p className="text-xs text-slate-500">
            Last import: {formatDateTime(import_data.imported_at)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-600">{import_data.prospect_count || 0} prospects</div>
          {import_data.won_count > 0 && (
            <div className="text-sm text-green-600 font-medium">
              {import_data.won_count} won ({formatCurrency(import_data.won_revenue)})
            </div>
          )}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-2">
        {[
          { key: 'emails', label: 'Emails', icon: 'mail' },
          { key: 'calls', label: 'Calls', icon: 'headset' },
          { key: 'meetings', label: 'Meetings', icon: 'users' },
          { key: 'proposals', label: 'Proposals', icon: 'notes' }
        ].map(({ key, label, icon }) => (
          <div key={key} className="flex items-center gap-2">
            <PixelIcon name={icon} size={16} className="opacity-60" />
            <span className="w-20 text-xs text-slate-600">{label}</span>
            <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(counts[key] || 0, targets[key] || 1)} transition-all`}
                style={{ width: `${getProgressPct(counts[key] || 0, targets[key] || 1)}%` }}
              />
            </div>
            <span className="w-16 text-xs text-slate-600 text-right">
              {counts[key] || 0}/{targets[key] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ IMPORT PANEL ============
function ImportPanel({ onImportComplete, imports, onRefresh }) {
  const [isDragging, setIsDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState(null)
  const [selectedMember, setSelectedMember] = useState('all')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [expandedImport, setExpandedImport] = useState(null)

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer?.files || e.target?.files || [])
    const jsonFiles = files.filter(f => f.name.endsWith('.json'))

    if (jsonFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please drop a JSON file' })
      return
    }

    setImporting(true)
    setMessage(null)

    try {
      for (const file of jsonFiles) {
        const text = await file.text()
        const data = JSON.parse(text)

        // Get user name from various possible fields
        const userName = data.userName || data.exportedBy || data.name || `Import ${new Date().toLocaleDateString()}`

        // Find or create team member
        const member = await findOrCreateTeamMember(userName)

        // Create import
        await createImport(member.id, data)
      }

      setMessage({ type: 'success', text: `Successfully imported ${jsonFiles.length} file(s)` })
      onImportComplete()
    } catch (err) {
      console.error('Import error:', err)
      setMessage({ type: 'error', text: `Import failed: ${err.message}` })
    } finally {
      setImporting(false)
    }
  }, [onImportComplete])

  const handleRestore = async (importId) => {
    if (confirmDelete !== `restore-${importId}`) {
      setConfirmDelete(`restore-${importId}`)
      return
    }
    setConfirmDelete(null)

    try {
      await restoreImport(importId)
      setMessage({ type: 'success', text: 'Import restored successfully' })
      onRefresh()
    } catch (err) {
      setMessage({ type: 'error', text: `Restore failed: ${err.message}` })
    }
  }

  const handleDelete = async (importId) => {
    if (confirmDelete !== `delete-${importId}`) {
      setConfirmDelete(`delete-${importId}`)
      return
    }
    setConfirmDelete(null)

    try {
      await deleteImport(importId)
      setMessage({ type: 'success', text: 'Import deleted' })
      onRefresh()
    } catch (err) {
      setMessage({ type: 'error', text: `Delete failed: ${err.message}` })
    }
  }

  const filteredImports = selectedMember === 'all'
    ? imports
    : imports.filter(i => i.team_member_id === selectedMember)

  const uniqueMembers = [...new Map(imports.map(i => [i.team_member_id, i.team_members?.name])).entries()]

  // Get source info from raw_data
  const getSourceInfo = (imp) => {
    const raw = imp.raw_data || {}
    return {
      userName: raw.userName || '',
      exportedBy: raw.exportedBy || '',
      exportedAt: raw.exportedAt || ''
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        Import Data
      </h2>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging ? 'border-slate-500 bg-slate-50' : 'border-slate-300'
        }`}
      >
        <PixelIcon name="file-plus" size={48} className="mx-auto mb-4 opacity-60" />
        <p className="text-slate-600 mb-2">
          {importing ? 'Importing...' : 'Drag & drop JSON files here'}
        </p>
        <p className="text-sm text-slate-400 mb-4">or</p>
        <label className="inline-block px-4 py-2 bg-slate-700 text-white rounded-lg cursor-pointer hover:bg-slate-800 transition">
          <input
            type="file"
            accept=".json"
            multiple
            onChange={handleDrop}
            className="hidden"
            disabled={importing}
          />
          Browse Files
        </label>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Import History */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-700" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Import History
          </h3>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1 text-sm"
          >
            <option value="all">All Members</option>
            {uniqueMembers.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredImports.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No imports yet
            </div>
          ) : (
            filteredImports.map(imp => {
              const source = getSourceInfo(imp)
              const isExpanded = expandedImport === imp.id
              const prospects = imp.raw_data?.prospects || []

              return (
                <div key={imp.id} className="border-b border-slate-100 last:border-b-0">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">
                          {imp.team_members?.name}
                          {imp.is_current && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                              Current
                            </span>
                          )}
                        </div>
                        {source.userName && source.userName !== imp.team_members?.name && (
                          <div className="text-xs text-blue-600 mt-0.5">
                            Source account: {source.userName}
                          </div>
                        )}
                        <div className="text-sm text-slate-500 mt-1">
                          Imported: {formatDateTime(imp.imported_at)}
                        </div>
                        <div className="text-xs text-slate-400">
                          Exported: {formatDateTime(imp.exported_at)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {imp.activity_count?.emails || 0} Emails | {imp.activity_count?.calls || 0} Calls |
                          {imp.activity_count?.meetings || 0} Meetings | {imp.activity_count?.proposals || 0} Proposals |
                          {imp.prospect_count || 0} Prospects
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => setExpandedImport(isExpanded ? null : imp.id)}
                          className="px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 text-sm"
                        >
                          {isExpanded ? 'Hide' : 'View'}
                        </button>
                        {!imp.is_current && (
                          <button
                            onClick={() => handleRestore(imp.id)}
                            className={`px-3 py-1 rounded text-sm ${
                              confirmDelete === `restore-${imp.id}`
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {confirmDelete === `restore-${imp.id}` ? 'Confirm' : 'Restore'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(imp.id)}
                          className={`px-3 py-1 rounded text-sm ${
                            confirmDelete === `delete-${imp.id}`
                              ? 'bg-red-600 text-white'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {confirmDelete === `delete-${imp.id}` ? 'Confirm' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-slate-50">
                      <div className="border-t border-slate-200 pt-4">
                        <h4 className="font-bold text-slate-700 mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          Prospects ({prospects.length})
                        </h4>
                        {prospects.length === 0 ? (
                          <p className="text-sm text-slate-400 italic">No prospects in this import</p>
                        ) : (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {prospects.map((p, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium text-slate-800">{p.company}</div>
                                    <div className="text-sm text-slate-600">{p.contact}</div>
                                    {p.email && <div className="text-xs text-slate-500">{p.email}</div>}
                                    {p.phone && <div className="text-xs text-slate-500">{p.phone}</div>}
                                  </div>
                                  <div className="text-right">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      p.stage === 'won' ? 'bg-green-100 text-green-700' :
                                      p.stage === 'lost' ? 'bg-red-100 text-red-700' :
                                      'bg-slate-100 text-slate-700'
                                    }`}>
                                      {p.stage}
                                    </span>
                                    {p.dealValue > 0 && (
                                      <div className="text-sm text-green-600 mt-1">
                                        {formatCurrency(p.dealValue)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {p.notes && p.notes.length > 0 && (
                                  <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                    Notes: {Array.isArray(p.notes) ? p.notes.join(', ') : p.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ============ CONTACT DETAIL MODAL ============
function ContactModal({ prospect, onClose }) {
  if (!prospect) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {prospect.company}
            </h3>
            <p className="text-sm text-slate-600">{prospect.contact}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <PixelIcon name="close" size={24} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Stage & Value */}
          <div className="flex justify-between items-center">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              prospect.stage === 'won' ? 'bg-green-100 text-green-700' :
              prospect.stage === 'lost' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {prospect.stage}
            </span>
            {prospect.deal_value > 0 && (
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(prospect.deal_value)}
              </span>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            {prospect.email && (
              <div className="flex items-center gap-2 text-sm">
                <PixelIcon name="mail" size={16} className="opacity-60" />
                <a href={`mailto:${prospect.email}`} className="text-blue-600 hover:underline">
                  {prospect.email}
                </a>
              </div>
            )}
            {prospect.phone && (
              <div className="flex items-center gap-2 text-sm">
                <PixelIcon name="headset" size={16} className="opacity-60" />
                <a href={`tel:${prospect.phone}`} className="text-blue-600 hover:underline">
                  {prospect.phone}
                </a>
              </div>
            )}
          </div>

          {/* Owner */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">Owned by</div>
            <div className="font-medium text-slate-800">{prospect.team_members?.name || 'Unknown'}</div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">Created</div>
              <div className="text-slate-700">{formatDate(prospect.created_at)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Last Touch</div>
              <div className="text-slate-700">{formatDate(prospect.last_touch)}</div>
            </div>
            {prospect.won_at && (
              <div className="col-span-2">
                <div className="text-xs text-slate-500">Won Date</div>
                <div className="text-green-600 font-medium">{formatDate(prospect.won_at)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ TEAM PIPELINE ============
function TeamPipeline({ prospects, teamMembers }) {
  const [filterMember, setFilterMember] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedProspect, setSelectedProspect] = useState(null)

  const stages = ['cold', 'contacted', 'meeting', 'proposal', 'won', 'lost']
  const stageColors = {
    cold: 'bg-slate-100 border-slate-300',
    contacted: 'bg-blue-50 border-blue-200',
    meeting: 'bg-purple-50 border-purple-200',
    proposal: 'bg-amber-50 border-amber-200',
    won: 'bg-green-50 border-green-200',
    lost: 'bg-red-50 border-red-200'
  }

  // Filter by member
  let filtered = filterMember === 'all'
    ? prospects
    : prospects.filter(p => p.team_member_id === filterMember)

  // Filter by search
  if (search.trim()) {
    const s = search.toLowerCase()
    filtered = filtered.filter(p =>
      p.company?.toLowerCase().includes(s) ||
      p.contact?.toLowerCase().includes(s) ||
      p.email?.toLowerCase().includes(s) ||
      p.phone?.toLowerCase().includes(s)
    )
  }

  const byStage = stages.reduce((acc, stage) => {
    acc[stage] = filtered.filter(p => p.stage === stage)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Team Pipeline
        </h2>
        <select
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
          className="border border-slate-200 rounded px-3 py-1.5"
        >
          <option value="all">All Members</option>
          {teamMembers.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <PixelIcon name="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
        <input
          type="text"
          placeholder="Search prospects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
        />
      </div>

      {/* Pipeline Stages */}
      <div className="space-y-4">
        {stages.map(stage => {
          const stageProspects = byStage[stage]
          const stageTotal = stageProspects.reduce((sum, p) => sum + (parseFloat(p.deal_value) || 0), 0)

          return (
            <div key={stage} className={`rounded-xl border-2 p-4 ${stageColors[stage]}`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-700 capitalize" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {stage}
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({stageProspects.length})
                  </span>
                </h3>
                <span className="text-sm font-medium text-slate-600">
                  {formatCurrency(stageTotal)}
                </span>
              </div>

              {stageProspects.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No prospects</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {stageProspects.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProspect(p)}
                      className="bg-white rounded-lg px-3 py-2 shadow-sm border border-slate-200 cursor-pointer hover:border-slate-400 hover:shadow transition-all"
                    >
                      <div className="font-medium text-slate-800 text-sm">{p.company}</div>
                      <div className="text-xs text-slate-500">{p.contact}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-slate-400">{p.team_members?.name}</span>
                        {p.deal_value > 0 && (
                          <span className="text-xs font-medium text-green-600">
                            {formatCurrency(p.deal_value)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Contact Modal */}
      {selectedProspect && (
        <ContactModal prospect={selectedProspect} onClose={() => setSelectedProspect(null)} />
      )}
    </div>
  )
}

// ============ CONTACTS LIST ============
function ContactsList({ prospects, teamMembers }) {
  const [search, setSearch] = useState('')
  const [filterMember, setFilterMember] = useState('all')
  const [filterStage, setFilterStage] = useState('all')
  const [selectedProspect, setSelectedProspect] = useState(null)

  const stages = ['cold', 'contacted', 'meeting', 'proposal', 'won', 'lost']

  // Apply filters
  let filtered = prospects

  if (filterMember !== 'all') {
    filtered = filtered.filter(p => p.team_member_id === filterMember)
  }

  if (filterStage !== 'all') {
    filtered = filtered.filter(p => p.stage === filterStage)
  }

  if (search.trim()) {
    const s = search.toLowerCase()
    filtered = filtered.filter(p =>
      p.company?.toLowerCase().includes(s) ||
      p.contact?.toLowerCase().includes(s) ||
      p.email?.toLowerCase().includes(s) ||
      p.phone?.toLowerCase().includes(s)
    )
  }

  // Find potential duplicates (same company name, different owners)
  const companyCount = {}
  prospects.forEach(p => {
    const key = p.company?.toLowerCase().trim()
    if (key) {
      if (!companyCount[key]) companyCount[key] = []
      companyCount[key].push(p.team_member_id)
    }
  })
  const duplicateCompanies = new Set(
    Object.entries(companyCount)
      .filter(([_, ids]) => new Set(ids).size > 1 || ids.length > 1)
      .map(([company]) => company)
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        Contacts
      </h2>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <PixelIcon name="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            type="text"
            placeholder="Search by company, contact, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
          >
            <option value="all">All Team Members</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
          >
            <option value="all">All Stages</option>
            {stages.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Duplicate Warning */}
      {duplicateCompanies.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <strong>Potential duplicates detected:</strong> {duplicateCompanies.size} companies appear multiple times
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-slate-500">
        Showing {filtered.length} of {prospects.length} contacts
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-xl shadow divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No contacts found
          </div>
        ) : (
          filtered.map(p => {
            const isDuplicate = duplicateCompanies.has(p.company?.toLowerCase().trim())

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProspect(p)}
                className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                  isDuplicate ? 'border-l-4 border-l-amber-400' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-slate-800 flex items-center gap-2">
                      {p.company}
                      {isDuplicate && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                          Duplicate?
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600">{p.contact}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {p.email && <span className="mr-3">{p.email}</span>}
                      {p.phone && <span>{p.phone}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      p.stage === 'won' ? 'bg-green-100 text-green-700' :
                      p.stage === 'lost' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {p.stage}
                    </span>
                    <div className="text-xs text-slate-400 mt-1">{p.team_members?.name}</div>
                    {p.deal_value > 0 && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        {formatCurrency(p.deal_value)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Contact Modal */}
      {selectedProspect && (
        <ContactModal prospect={selectedProspect} onClose={() => setSelectedProspect(null)} />
      )}
    </div>
  )
}

// ============ REPORTS ============
function Reports({ currentImports, activities, prospects }) {
  // Leaderboard by activity count
  const leaderboard = currentImports
    .map(imp => {
      const counts = imp.activity_count || {}
      const total = (counts.emails || 0) + (counts.calls || 0) + (counts.meetings || 0) + (counts.proposals || 0)
      return {
        name: imp.team_members?.name || 'Unknown',
        ...counts,
        total,
        wonDeals: imp.won_count || 0,
        wonRevenue: parseFloat(imp.won_revenue) || 0
      }
    })
    .sort((a, b) => b.total - a.total)

  // Pipeline summary
  const stages = ['cold', 'contacted', 'meeting', 'proposal', 'won', 'lost']
  const pipelineSummary = stages.map(stage => {
    const stageProspects = prospects.filter(p => p.stage === stage)
    return {
      stage,
      count: stageProspects.length,
      value: stageProspects.reduce((sum, p) => sum + (parseFloat(p.deal_value) || 0), 0)
    }
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        Reports
      </h2>

      {/* Activity Leaderboard */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-700" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Activity Leaderboard
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Name</th>
                <th className="text-center p-3">Emails</th>
                <th className="text-center p-3">Calls</th>
                <th className="text-center p-3">Meetings</th>
                <th className="text-center p-3">Proposals</th>
                <th className="text-center p-3">Total</th>
                <th className="text-center p-3">Won</th>
                <th className="text-right p-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((member, idx) => (
                <tr key={member.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-3 font-medium text-slate-800">{member.name}</td>
                  <td className="p-3 text-center">{member.emails || 0}</td>
                  <td className="p-3 text-center">{member.calls || 0}</td>
                  <td className="p-3 text-center">{member.meetings || 0}</td>
                  <td className="p-3 text-center">{member.proposals || 0}</td>
                  <td className="p-3 text-center font-bold">{member.total}</td>
                  <td className="p-3 text-center text-green-600">{member.wonDeals}</td>
                  <td className="p-3 text-right text-green-600 font-medium">
                    {formatCurrency(member.wonRevenue)}
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No data to display
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-700" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Pipeline Summary
          </h3>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {pipelineSummary.map(({ stage, count, value }) => (
            <div key={stage} className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500 uppercase mb-1">{stage}</div>
              <div className="text-2xl font-bold text-slate-800">{count}</div>
              <div className="text-sm text-slate-600">{formatCurrency(value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============ SETTINGS ============
function Settings({ teamMembers, onDeleteMember, onRefresh }) {
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleDelete = async (id, name) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id)
      return
    }

    try {
      await onDeleteMember(id)
      setConfirmDelete(null)
    } catch (err) {
      alert(`Failed to delete: ${err.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        Settings
      </h2>

      {/* Team Members */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-700" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Team Members
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {teamMembers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No team members yet. Import data to add members.
            </div>
          ) : (
            teamMembers.map(member => (
              <div key={member.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-slate-800">{member.name}</div>
                  <div className="text-xs text-slate-500">
                    Added: {formatDate(member.created_at)}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(member.id, member.name)}
                  className={`px-3 py-1 rounded text-sm ${
                    confirmDelete === member.id
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {confirmDelete === member.id ? 'Confirm Delete' : 'Delete'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* App Info */}
      <div className="text-center text-sm text-slate-400 mt-8">
        <p>CAMANO Mission Control v{APP_VERSION}</p>
        <p>Built: {BUILD_DATE}</p>
      </div>
    </div>
  )
}

// ============ MAIN APP ============
export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState([])
  const [imports, setImports] = useState([])
  const [currentImports, setCurrentImports] = useState([])
  const [activities, setActivities] = useState([])
  const [prospects, setProspects] = useState([])
  const [stats, setStats] = useState(null)

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    try {
      const [members, allImports, current, acts, pros, teamStats] = await Promise.all([
        getTeamMembers(),
        getImports(),
        getCurrentImports(),
        getActivities({ limit: 100 }),
        getProspects(),
        getTeamStats()
      ])

      setTeamMembers(members)
      setImports(allImports)
      setCurrentImports(current)
      setActivities(acts)
      setProspects(pros)
      setStats(teamStats)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDeleteMember = async (id) => {
    await deleteTeamMember(id)
    loadData()
  }

  // Show setup screen if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return <SetupScreen />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <PixelIcon name="loader" size={48} className="mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'chart-bar' },
    { id: 'import', label: 'Import', icon: 'file-plus' },
    { id: 'contacts', label: 'Contacts', icon: 'user' },
    { id: 'pipeline', label: 'Pipeline', icon: 'trending-up' },
    { id: 'reports', label: 'Reports', icon: 'clipboard' },
    { id: 'settings', label: 'Settings', icon: 'sliders' }
  ]

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Header Banner */}
      <header className="shadow-lg">
        <img src="/banner.png" alt="CAMANO Sales Mission Control" className="w-full" />
      </header>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {tab === 'dashboard' && (
          <TeamDashboard
            teamMembers={teamMembers}
            currentImports={currentImports}
            stats={stats}
            onRefresh={loadData}
          />
        )}
        {tab === 'import' && (
          <ImportPanel
            onImportComplete={loadData}
            imports={imports}
            onRefresh={loadData}
          />
        )}
        {tab === 'contacts' && (
          <ContactsList
            prospects={prospects}
            teamMembers={teamMembers}
          />
        )}
        {tab === 'pipeline' && (
          <TeamPipeline
            prospects={prospects}
            teamMembers={teamMembers}
          />
        )}
        {tab === 'reports' && (
          <Reports
            currentImports={currentImports}
            activities={activities}
            prospects={prospects}
          />
        )}
        {tab === 'settings' && (
          <Settings
            teamMembers={teamMembers}
            onDeleteMember={handleDeleteMember}
            onRefresh={loadData}
          />
        )}
      </div>

      {/* Version Footer */}
      <div className="text-center text-xs text-slate-400 pb-24 mt-8">
        v{APP_VERSION} | {BUILD_DATE}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex justify-around max-w-lg mx-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 flex flex-col items-center transition-colors ${
                tab === t.id ? 'text-slate-800' : 'text-slate-400'
              }`}
            >
              <PixelIcon
                name={t.icon}
                size={24}
                className={tab === t.id ? '' : 'opacity-50'}
              />
              <span className="text-xs mt-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
