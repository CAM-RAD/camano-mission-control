import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create client only if credentials are configured
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null
}

// Team Members
export async function getTeamMembers() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data || []
}

export async function findOrCreateTeamMember(name) {
  if (!supabase) return null

  // Try to find existing member
  let { data: member } = await supabase
    .from('team_members')
    .select('*')
    .eq('name', name)
    .single()

  if (!member) {
    // Create new member
    const { data: newMember, error } = await supabase
      .from('team_members')
      .insert({ name })
      .select()
      .single()
    if (error) throw error
    member = newMember
  }

  return member
}

export async function deleteTeamMember(id) {
  if (!supabase) return
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// Imports
export async function getImports(teamMemberId = null) {
  if (!supabase) return []
  let query = supabase
    .from('imports')
    .select('*, team_members(name)')
    .order('imported_at', { ascending: false })

  if (teamMemberId) {
    query = query.eq('team_member_id', teamMemberId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getCurrentImports() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('imports')
    .select('*, team_members(name)')
    .eq('is_current', true)
  if (error) throw error
  return data || []
}

export async function createImport(teamMemberId, jsonData) {
  if (!supabase) return null

  // Calculate stats from JSON
  const activities = jsonData.activities || []
  const prospects = jsonData.prospects || []
  const wonProspects = prospects.filter(p => p.stage === 'won')

  const activityCount = {
    emails: activities.filter(a => a.type === 'emails').length,
    calls: activities.filter(a => a.type === 'calls').length,
    meetings: activities.filter(a => a.type === 'meetings').length,
    proposals: activities.filter(a => a.type === 'proposals').length
  }

  // Set all other imports for this member to not current
  await supabase
    .from('imports')
    .update({ is_current: false })
    .eq('team_member_id', teamMemberId)

  // Create new import
  const { data: importRecord, error } = await supabase
    .from('imports')
    .insert({
      team_member_id: teamMemberId,
      exported_at: jsonData.exportedAt || new Date().toISOString(),
      week_start: jsonData.currentWeekStart,
      raw_data: jsonData,
      is_current: true,
      targets: jsonData.targets,
      activity_count: activityCount,
      prospect_count: prospects.length,
      won_count: wonProspects.length,
      won_revenue: wonProspects.reduce((sum, p) => sum + (p.dealValue || 0), 0)
    })
    .select()
    .single()

  if (error) throw error

  // Delete old activities/prospects for this member
  await supabase.from('activities').delete().eq('team_member_id', teamMemberId)
  await supabase.from('prospects').delete().eq('team_member_id', teamMemberId)

  // Insert activities
  const allActivities = [
    ...activities.map(a => ({
      import_id: importRecord.id,
      team_member_id: teamMemberId,
      type: a.type,
      name: a.name || '',
      notes: a.notes || '',
      timestamp: a.timestamp,
      week_of: null
    })),
    ...(jsonData.archivedActivities || []).map(a => ({
      import_id: importRecord.id,
      team_member_id: teamMemberId,
      type: a.type,
      name: a.name || '',
      notes: a.notes || '',
      timestamp: a.timestamp,
      week_of: a.weekOf
    }))
  ]

  if (allActivities.length > 0) {
    await supabase.from('activities').insert(allActivities)
  }

  // Insert prospects
  const prospectRecords = prospects.map(p => ({
    import_id: importRecord.id,
    team_member_id: teamMemberId,
    company: p.company,
    contact: p.contact || '',
    email: p.email || '',
    phone: p.phone || '',
    stage: p.stage,
    deal_value: p.dealValue || 0,
    created_at: p.createdAt,
    last_touch: p.lastTouch,
    won_at: p.wonAt
  }))

  if (prospectRecords.length > 0) {
    await supabase.from('prospects').insert(prospectRecords)
  }

  return importRecord
}

export async function restoreImport(importId) {
  if (!supabase) return null

  // Get the import record
  const { data: importRecord, error } = await supabase
    .from('imports')
    .select('*')
    .eq('id', importId)
    .single()

  if (error) throw error

  // Re-import from raw_data
  return await createImport(importRecord.team_member_id, importRecord.raw_data)
}

export async function deleteImport(importId) {
  if (!supabase) return
  const { error } = await supabase
    .from('imports')
    .delete()
    .eq('id', importId)
  if (error) throw error
}

// Activities
export async function getActivities(filters = {}) {
  if (!supabase) return []
  let query = supabase
    .from('activities')
    .select('*, team_members(name)')
    .order('timestamp', { ascending: false })

  if (filters.teamMemberId) {
    query = query.eq('team_member_id', filters.teamMemberId)
  }
  if (filters.type) {
    query = query.eq('type', filters.type)
  }
  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Prospects
export async function getProspects(filters = {}) {
  if (!supabase) return []
  let query = supabase
    .from('prospects')
    .select('*, team_members(name)')
    .order('last_touch', { ascending: false })

  if (filters.teamMemberId) {
    query = query.eq('team_member_id', filters.teamMemberId)
  }
  if (filters.stage) {
    query = query.eq('stage', filters.stage)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Aggregate stats
export async function getTeamStats() {
  if (!supabase) return null

  const imports = await getCurrentImports()

  const totals = {
    emails: 0,
    calls: 0,
    meetings: 0,
    proposals: 0,
    prospects: 0,
    wonDeals: 0,
    wonRevenue: 0
  }

  imports.forEach(imp => {
    const counts = imp.activity_count || {}
    totals.emails += counts.emails || 0
    totals.calls += counts.calls || 0
    totals.meetings += counts.meetings || 0
    totals.proposals += counts.proposals || 0
    totals.prospects += imp.prospect_count || 0
    totals.wonDeals += imp.won_count || 0
    totals.wonRevenue += parseFloat(imp.won_revenue) || 0
  })

  return totals
}
