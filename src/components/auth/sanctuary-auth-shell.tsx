'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Leaf } from 'lucide-react'

interface SanctuaryAuthShellProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

export function SanctuaryAuthShell({ eyebrow, title, description, children }: SanctuaryAuthShellProps) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#eef1e5] px-4 py-8 text-[#304b2b]">
      <Image src="/garden/backgrounds/sanctuary-golden-hour.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-55" />
      <div className="absolute inset-0 bg-[#eef1e5]/45 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-md rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/92 p-6 shadow-[0_30px_80px_rgba(37,66,33,0.2)] backdrop-blur-xl sm:p-8">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-display text-xl font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#dfe9d3]"><Leaf className="h-5 w-5 text-[#5f854f]" /></span> Habien
        </Link>
        <div className="text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#74886b]"><Leaf className="h-4 w-4" /> {eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-[#315027]">{title}</h1>
          <p className="mt-3 leading-6 text-[#6b7866]">{description}</p>
        </div>
        <div className="mt-7">{children}</div>
      </div>
    </main>
  )
}
