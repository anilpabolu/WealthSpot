/**
 * Offline mutation queue for Netegron mobile.
 *
 * When the device is offline, mutations (POST/PATCH/DELETE) are captured in a
 * persisted MMKV queue. When connectivity returns, React Query's onlineManager
 * fires and we replay them in order.
 *
 * USAGE
 *   Mount <OfflineQueueProvider /> once inside QueryClientProvider in _layout.tsx.
 *   In hooks, pass `meta: { offlineQueue: true }` on any mutation that should be queued.
 *
 * DESIGN NOTES
 *  - Only mutations explicitly tagged with `meta.offlineQueue` are queued.
 *  - The queue is bounded (MAX_QUEUE_SIZE). Oldest entries are dropped if full.
 *  - Payloads are stored as JSON — avoid putting File/Blob objects in queued mutations.
 *  - Each entry is replayed by calling the shared API client directly, so the
 *    retry-with-backoff logic in @wealthspot/api-client applies.
 *
 * Limitations:
 *  - No conflict resolution — last write wins on replay.
 *  - Queued mutations do NOT get React Query's optimistic cache updates.
 */

import { useEffect, useRef } from 'react'
import { onlineManager } from '@tanstack/react-query'
import { MMKV } from 'react-native-mmkv'
import { apiPost, apiPatch, apiPut, apiDelete } from './api'

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const NetInfo = require('@react-native-community/netinfo').default as {
  addEventListener: (cb: (state: { isConnected: boolean | null; isInternetReachable: boolean | null | undefined }) => void) => () => void
}

const storage = new MMKV({ id: 'ws-offline-queue' })
const QUEUE_KEY = 'queue'
const MAX_QUEUE_SIZE = 50

export type HttpMethod = 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface QueuedMutation {
  id: string
  method: HttpMethod
  url: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any
  queuedAt: number
}

// ── Queue CRUD helpers ───────────────────────────────────────────────────────

function readQueue(): QueuedMutation[] {
  try {
    const raw = storage.getString(QUEUE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as QueuedMutation[]
  } catch {
    return []
  }
}

function writeQueue(q: QueuedMutation[]): void {
  storage.set(QUEUE_KEY, JSON.stringify(q))
}

/**
 * Add a mutation to the offline queue. Call this from catch blocks when the
 * API call fails and `NetInfo.fetch()` confirms the device is offline.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function enqueue(method: HttpMethod, url: string, body?: any): void {
  const q = readQueue()
  const entry: QueuedMutation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    method,
    url,
    body,
    queuedAt: Date.now(),
  }
  const updated = [...q, entry].slice(-MAX_QUEUE_SIZE)
  writeQueue(updated)
}

async function replayQueue(): Promise<void> {
  const q = readQueue()
  if (q.length === 0) return

  const failed: QueuedMutation[] = []
  for (const entry of q) {
    try {
      switch (entry.method) {
        case 'POST':   await apiPost(entry.url, entry.body); break
        case 'PATCH':  await apiPatch(entry.url, entry.body); break
        case 'PUT':    await apiPut(entry.url, entry.body); break
        case 'DELETE': await apiDelete(entry.url); break
      }
    } catch {
      // If replay fails even when online, keep the entry so it retries next time.
      failed.push(entry)
    }
  }
  writeQueue(failed)
}

// ── Provider component ───────────────────────────────────────────────────────

/**
 * Mount once inside QueryClientProvider. Wires NetInfo into React Query's
 * onlineManager and triggers queue replay when connectivity is restored.
 */
export function OfflineQueueProvider(): null {
  const wasOnlineRef = useRef<boolean>(true)

  useEffect(() => {
    // Sync NetInfo connectivity state → React Query onlineManager.
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected === true && state.isInternetReachable !== false
      onlineManager.setOnline(isOnline)

      if (isOnline && !wasOnlineRef.current) {
        // Coming back online — replay any queued mutations.
        void replayQueue()
      }
      wasOnlineRef.current = isOnline
    })

    return () => unsubscribe()
  }, [])

  return null
}


