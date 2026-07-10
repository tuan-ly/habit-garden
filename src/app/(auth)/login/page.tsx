'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SanctuaryAuthShell } from '@/components/auth/sanctuary-auth-shell'
import { login, signInWithGoogle } from '../actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(formData: FormData) {
    setError(null)
    setIsLoading(true)
    try {
      const result = await login(formData)
      if (result?.error) setError(result.error)
    } catch (caught) {
      const message = (caught as Error)?.message
      if (!message?.includes('NEXT_REDIRECT')) setError('Không thể đăng nhập lúc này. Hãy thử lại nhé.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SanctuaryAuthShell eyebrow="Khu vườn vẫn đang chờ" title="Mừng bạn trở lại" description="Không có gì bị mất khi bạn vắng mặt. Hãy tiếp tục từ một bước nhỏ hôm nay.">
      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      <form action={handleLogin} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required disabled={isLoading} className="h-12 rounded-2xl bg-white/80" /></div>
        <div className="space-y-2"><Label htmlFor="password">Mật khẩu</Label><Input id="password" name="password" type="password" autoComplete="current-password" required disabled={isLoading} className="h-12 rounded-2xl bg-white/80" /></div>
        <Button type="submit" disabled={isLoading} className="min-h-13 w-full rounded-full bg-[#5f854f] font-bold text-white hover:bg-[#527644]">{isLoading ? 'Đang mở cổng vườn…' : 'Trở lại khu vườn'}</Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-[#8a9684]"><span className="h-px flex-1 bg-[#dfe5d8]" />hoặc<span className="h-px flex-1 bg-[#dfe5d8]" /></div>
      <form><Button formAction={signInWithGoogle} variant="outline" className="min-h-12 w-full rounded-full border-[#d3ddca] bg-white/65 font-bold">Tiếp tục với Google</Button></form>
      <p className="mt-6 text-center text-sm text-[#6f7d69]">Chưa có khu vườn? <Link href="/signup" className="font-extrabold text-[#527644] hover:underline">Gieo hạt đầu tiên</Link></p>
    </SanctuaryAuthShell>
  )
}
