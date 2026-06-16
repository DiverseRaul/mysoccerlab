// Supabase-backed store for the AI Coach's multiple conversations.
//
// Conversations live in `ai_conversations`; messages in `ai_chat_messages`
// (linked by `conversation_id`). See migration 0017_ai_chat_history.sql.
// All calls are own-user only (RLS enforces it server-side too).

import { supabase } from './supabase'

export async function fetchConversations(userId) {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id, title, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) { console.error('fetchConversations:', error); return [] }
  return data || []
}

export async function createConversation(userId) {
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ user_id: userId, title: 'New chat' })
    .select('id, title, updated_at')
    .single()
  if (error) { console.error('createConversation:', error); return null }
  return data
}

export async function renameConversation(id, title) {
  const { error } = await supabase
    .from('ai_conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) console.error('renameConversation:', error)
}

export async function touchConversation(id) {
  const { error } = await supabase
    .from('ai_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) console.error('touchConversation:', error)
}

export async function deleteConversation(id) {
  const { error } = await supabase.from('ai_conversations').delete().eq('id', id)
  if (error) console.error('deleteConversation:', error)
}

export async function fetchMessages(conversationId) {
  const { data, error } = await supabase
    .from('ai_chat_messages')
    .select('id, role, content, calendar_days, time_label, feedback, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) { console.error('fetchMessages:', error); return [] }
  return (data || []).map((r) => ({
    id: r.id,
    role: r.role,
    content: r.content || '',
    calendarDays: r.calendar_days || [],
    feedback: r.feedback || 0,
    time: r.time_label || ''
  }))
}

export async function setMessageFeedback(id, value) {
  if (id == null) return
  const { error } = await supabase.from('ai_chat_messages').update({ feedback: value }).eq('id', id)
  if (error) console.error('setMessageFeedback:', error)
}

// Returns the new row id so the client can later edit/delete that message.
export async function insertMessage(conversationId, userId, msg) {
  const { data, error } = await supabase.from('ai_chat_messages').insert({
    conversation_id: conversationId,
    user_id: userId,
    role: msg.role,
    content: msg.content || '',
    calendar_days: msg.calendarDays && msg.calendarDays.length ? msg.calendarDays : null,
    time_label: msg.time || ''
  }).select('id').single()
  if (error) { console.error('insertMessage:', error); return null }
  return data ? data.id : null
}

export async function deleteMessage(id) {
  if (id == null) return
  const { error } = await supabase.from('ai_chat_messages').delete().eq('id', id)
  if (error) console.error('deleteMessage:', error)
}

// First user line becomes the chat title (so the list is scannable).
export function deriveTitle(messages) {
  const firstUser = messages.find((m) => m.role === 'user' && m.content)
  if (!firstUser) return 'New chat'
  const t = firstUser.content.trim().replace(/\s+/g, ' ')
  return t.length > 38 ? t.slice(0, 37) + '…' : t
}
