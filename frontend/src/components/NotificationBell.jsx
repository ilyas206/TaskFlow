import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, BellRing } from 'lucide-react'
import { notificationKeys, notificationsApi } from '../api/notifications'
import { formatDate } from '../lib/format'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Refresh every minute, so new assignments appear without a page reload
  const { data } = useQuery({
    queryKey: notificationKeys.all,
    queryFn: notificationsApi.list,
    refetchInterval: 60_000,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: notificationKeys.all })

  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: refresh })
  const markAllRead = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: refresh })

  // Close the panel when clicking outside it
  useEffect(() => {
    function handleClick(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleOpenNotification(item) {
    if (!item.read) {
      markRead.mutate(item.id)
    }
    setOpen(false)
    navigate(`/taches/${item.project_id}`)
  }

  const unread = data?.unread_count ?? 0

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-30">
      <button
        onClick={() => setOpen((value) => !value)}
        title="Notifications"
        className={`relative rounded-xl p-3.5 ${open ? 'bg-surface text-ink' : 'bg-brand-600 text-brand-50 hover:bg-brand-700'} transition duration-350 shadow-lg`}
      >
        {unread > 0 ? <BellRing size={20} /> : <Bell size={20} /> }
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-15 right-0 z-20 w-96 max-w-[calc(100vw-3rem)] overflow-hidden rounded-3xl bg-card shadow-[0_0_24px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between border-b border-surface px-5 py-4">
            <h2 className="font-semibold text-ink">Notifications</h2>
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs font-semibold text-brand-500 hover:text-brand-700"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {data?.items.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-muted">Aucune notification.</p>
            )}

            <ul>
              {data?.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleOpenNotification(item)}
                    className={`flex w-full gap-3 px-5 py-4 text-left hover:bg-surface ${
                      item.read ? '' : 'bg-brand-50/50'
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        item.read ? 'bg-transparent' : item.kind === 'due_soon' ? 'bg-red-500' : 'bg-brand-500'
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{item.title}</span>
                      <span className="mt-0.5 block text-sm text-muted">{item.message}</span>
                      <span className="mt-1 block text-xs text-ink">{formatDate(item.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}