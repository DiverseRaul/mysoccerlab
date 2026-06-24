import { supabase } from './supabase'

// PostgREST encodes `.in('col', [...])` into the request URL. A long id list
// (a power user with hundreds of matches) blows past the proxy URL-length cap,
// at which point the request silently fails and returns an empty array — the
// stats just vanish with no error. To stay safe we split the id list into
// fixed-size batches and merge the results. Batches run in parallel, so this is
// no slower than one big request for normal data sizes.
const BATCH_SIZE = 100

/**
 * Select rows from `table` filtered by `column IN (ids)`, batched so the id list
 * can never overflow the request URL.
 *
 * @returns {Promise<{ data: any[], error: any }>} merged rows; `error` is the
 *          first batch error encountered (with whatever data did come back).
 */
export async function selectByIds(table, columns, ids, column = 'match_id') {
  if (!ids || ids.length === 0) return { data: [], error: null }

  const batches = []
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    batches.push(ids.slice(i, i + BATCH_SIZE))
  }

  const results = await Promise.all(
    batches.map((batch) => supabase.from(table).select(columns).in(column, batch))
  )

  const error = results.find((r) => r.error)?.error || null
  const data = results.flatMap((r) => r.data || [])
  return { data, error }
}
