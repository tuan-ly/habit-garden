self.addEventListener('push', event => {
  let payload = {}

  try {
    payload = event.data?.json() ?? {}
  } catch {
    payload = { body: event.data?.text() }
  }

  const title = typeof payload.title === 'string'
    ? payload.title
    : 'Habit Garden'
  const body = typeof payload.body === 'string'
    ? payload.body
    : 'Khu vườn có một lời nhắc mới.'
  const url = typeof payload.url === 'string'
    && payload.url.startsWith('/')
    && !payload.url.startsWith('//')
    ? payload.url
    : '/garden'

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: typeof payload.icon === 'string'
      ? payload.icon
      : '/icons/icon-192x192.png',
    badge: typeof payload.badge === 'string'
      ? payload.badge
      : '/icons/icon-72x72.png',
    tag: typeof payload.tag === 'string' ? payload.tag : undefined,
    data: {
      url,
      notificationId: payload.notificationId,
      type: payload.type,
    },
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const relativeUrl = event.notification.data?.url
  const targetUrl = new URL(
    typeof relativeUrl === 'string' ? relativeUrl : '/garden',
    self.location.origin
  )

  if (targetUrl.origin !== self.location.origin) return

  event.waitUntil(self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  }).then(async clients => {
    const existingClient = clients.find(client => (
      new URL(client.url).origin === self.location.origin
    ))

    if (existingClient) {
      if ('navigate' in existingClient) await existingClient.navigate(targetUrl.href)
      return existingClient.focus()
    }

    return self.clients.openWindow(targetUrl.href)
  }))
})
