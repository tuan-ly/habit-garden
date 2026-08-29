'use client'

import { useEffect } from 'react'
import { getHabitReminderSettings } from '@/lib/actions/notifications'
import {
  bindHabitCompletionReminder,
  bindNativeNotificationNavigation,
  deferNativeHabitReminderUntilTomorrow,
  isNativeNotificationPlatform,
  syncNativeHabitReminders,
} from '@/lib/native-notifications'

interface NativeReminderSyncProps {
  globallyEnabled: boolean
}

export function NativeReminderSync({ globallyEnabled }: NativeReminderSyncProps) {
  useEffect(() => {
    if (!isNativeNotificationPlatform()) return

    let cancelled = false
    let unbind: () => void = () => undefined
    const settingsPromise = getHabitReminderSettings()
    const unbindCompletion = bindHabitCompletionReminder((plantId) => {
      void settingsPromise.then(settings => {
        const setting = settings.find(item => item.plantId === plantId)
        if (!cancelled && setting) {
          void deferNativeHabitReminderUntilTomorrow(setting).catch(error => {
            console.error('Unable to defer the completed habit reminder:', error)
          })
        }
      }).catch(error => {
        console.error('Unable to defer the completed habit reminder:', error)
      })
    })

    void Promise.all([
      settingsPromise,
      bindNativeNotificationNavigation(),
    ]).then(([settings, removeListener]) => {
      if (cancelled) {
        removeListener()
        return
      }

      unbind = removeListener
      void syncNativeHabitReminders(settings, globallyEnabled).catch(error => {
        console.error('Unable to sync native habit reminders:', error)
      })
    }).catch(error => {
      console.error('Unable to initialize native habit reminders:', error)
    })

    return () => {
      cancelled = true
      unbind()
      unbindCompletion()
    }
  }, [globallyEnabled])

  return null
}
