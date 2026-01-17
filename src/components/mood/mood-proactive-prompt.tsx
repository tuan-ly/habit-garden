'use client'

import { useEffect, useState } from 'react'
import { useMood } from '@/lib/context/mood-context'
import { MoodCheckInDialog } from './mood-check-in-dialog'

export function MoodProactivePrompt() {
    const { isMoodSet, isLoading } = useMood()
    const [showPrompt, setShowPrompt] = useState(false)

    useEffect(() => {
        // Show prompt if loading is finished and mood is not set today
        if (!isLoading && !isMoodSet) {
            // Small delay to let the app settle
            const timer = setTimeout(() => {
                setShowPrompt(true)
            }, 1500)
            return () => clearTimeout(timer)
        } else if (isMoodSet) {
            setShowPrompt(false)
        }
    }, [isLoading, isMoodSet])

    return (
        <MoodCheckInDialog
            open={showPrompt}
            onOpenChange={setShowPrompt}
        />
    )
}
