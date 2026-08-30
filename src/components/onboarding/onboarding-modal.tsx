'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Leaf, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const ONBOARDING_KEY = 'habit-garden-onboarding-completed'
const PROMPT_ADD_PLANT_KEY = 'habit-garden-prompt-add-plant'

interface OnboardingModalProps {
  onOpenAddPlant?: () => void
}

export function OnboardingModal({ onOpenAddPlant }: OnboardingModalProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<0 | 1>(0)

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      const timer = window.setTimeout(() => setOpen(true), 350)
      return () => window.clearTimeout(timer)
    }
  }, [])

  const finish = (plantSeed: boolean) => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    if (plantSeed) localStorage.setItem(PROMPT_ADD_PLANT_KEY, 'true')
    setOpen(false)
    if (plantSeed) onOpenAddPlant?.()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setOpen(true)
      return
    }

    finish(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto border-[#d6e0cc] bg-[#fffaf0] p-0 text-[#304b2b] sm:max-w-md">
        <div className="relative overflow-hidden rounded-[inherit] px-6 pb-7 pt-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,#dce9cc,transparent_72%)]" />
          <div className="relative">
            <div className="mb-7 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#71836a]">
                <Leaf className="h-4 w-4" /> Habien
              </span>
              <span className="text-xs font-bold text-[#8a9982]">{step + 1}/2</span>
            </div>

            {step === 0 ? (
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-[2.5rem] border border-white/80 bg-white/65 shadow-[0_24px_55px_rgba(71,105,62,0.14)]">
                  <span className="relative h-24 w-24 drop-shadow-[0_10px_14px_rgba(64,93,55,0.2)]">
                    <Image src="/plants/generic/02-sprout.png" alt="Một mầm cây nhỏ" fill sizes="96px" className="object-contain" />
                  </span>
                </div>
                <DialogHeader className="items-center">
                  <DialogTitle className="max-w-xs font-display text-3xl leading-tight text-[#315027]">
                    Một nơi để điều nhỏ bé được lớn lên
                  </DialogTitle>
                  <DialogDescription className="mt-3 max-w-sm text-base leading-7 text-[#697765]">
                    Mỗi thói quen là một cây. Bạn quay lại, ghi nhận một bước nhỏ và khu vườn sẽ nhớ thay bạn.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-7 rounded-3xl border border-[#dce5d4] bg-white/65 p-4 text-left text-sm leading-6 text-[#5f7059]">
                  <Sparkles className="mr-2 inline h-4 w-4 text-[#799568]" />
                  Bỏ lỡ một ngày không phá hỏng điều gì. Cây chỉ nghỉ và chờ bạn trở lại.
                </div>
                <Button onClick={() => setStep(1)} className="mt-6 min-h-14 w-full rounded-full bg-[#5f854f] text-base font-bold text-white hover:bg-[#527644]">
                  Bước vào khu vườn <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-6 grid h-40 w-40 rotate-45 grid-cols-2 gap-2 rounded-[2.25rem] bg-[#d7e4c9] p-4 shadow-[0_24px_55px_rgba(71,105,62,0.15)]">
                  {[0, 1, 2, 3].map((cell) => (
                    <div key={cell} className="rounded-2xl border border-white/55 bg-[#a9bf91]">
                      {cell === 0 && (
                        <span className="relative flex h-full -rotate-45 items-center justify-center">
                          <Image src="/plants/generic/01-seed.png" alt="Hạt giống đầu tiên" width={52} height={52} className="object-contain" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <DialogHeader className="items-center">
                  <DialogTitle className="font-display text-3xl leading-tight text-[#315027]">
                    Hôm nay bạn muốn gieo điều gì?
                  </DialogTitle>
                  <DialogDescription className="mt-3 text-base leading-7 text-[#697765]">
                    Chọn đúng một thói quen đủ nhỏ để bạn có thể chăm trong hai phút.
                  </DialogDescription>
                </DialogHeader>
                <Button onClick={() => finish(true)} className="mt-7 min-h-14 w-full rounded-full bg-[#5f854f] text-base font-bold text-white hover:bg-[#527644]">
                  Gieo hạt đầu tiên <Leaf className="ml-2 h-5 w-5" />
                </Button>
                <button onClick={() => finish(false)} className="mt-4 min-h-11 px-4 text-sm font-semibold text-[#7c8a76] hover:text-[#4d6746]">
                  Để mình dạo quanh trước
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
