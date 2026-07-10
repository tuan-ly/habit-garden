import Link from 'next/link'
import { ArrowRight, BookOpen, Flower2, Settings2, Sparkles, Store } from 'lucide-react'
import { getAuthUser } from '@/lib/auth-cached'
import { getProfile, getUserStats } from '@/lib/actions/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TimezoneSelector } from '@/components/profile'

export default async function ProfilePage() {
  const [user, profile, stats] = await Promise.all([getAuthUser(), getProfile(), getUserStats()])
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Người làm vườn'

  return (
    <main className="h-dvh overflow-y-auto bg-[#eef1e5] px-4 pb-32 pt-5 text-[#304b2b]">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#75876e]">Không gian của tôi</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Tôi</h1>

        <section className="mt-5 overflow-hidden rounded-[2.2rem] border border-white/80 bg-[#fffaf0] p-6 shadow-[0_22px_55px_rgba(49,75,43,0.11)]">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-[#dce8d2]">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt="" />
              <AvatarFallback className="bg-[#dce8cb] font-display text-2xl font-semibold text-[#4d6b43]">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-2xl font-semibold">{displayName}</h2>
              <p className="mt-1 truncate text-sm text-[#768170]">{user?.email}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#e2ead9] px-3 py-1 text-xs font-bold text-[#58704f]"><Sparkles className="h-3.5 w-3.5" /> Người giữ khu vườn</p>
            </div>
          </div>

          <blockquote className="mt-6 rounded-3xl bg-[#edf1e7] p-5 font-display text-xl italic leading-8 text-[#496241]">
            “Mình không cần hoàn hảo. Mình chỉ cần tiếp tục trở lại.”
          </blockquote>
        </section>

        <section className="mt-4 grid grid-cols-3 gap-2 rounded-[2rem] border border-[#dce3d5] bg-white/60 p-3 text-center">
          {[
            ['Cây', stats?.totalPlants ?? 0],
            ['Lần chăm', stats?.totalWaterings ?? 0],
            ['Đang lớn', stats?.growing ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl px-2 py-3"><p className="font-display text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#788273]">{label}</p></div>
          ))}
        </section>

        <section className="mt-5 space-y-2">
          <Link href="/overview" className="flex min-h-16 items-center gap-4 rounded-3xl border border-[#dce3d5] bg-white/65 px-5 font-bold hover:bg-white">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dfe9d3] text-[#5f854f]"><BookOpen className="h-5 w-5" /></span>
            <span className="flex-1">Hành trình của tôi</span><ArrowRight className="h-5 w-5 text-[#85917f]" />
          </Link>
          <Link href="/identity" className="flex min-h-16 items-center gap-4 rounded-3xl border border-[#dce3d5] bg-white/65 px-5 font-bold hover:bg-white">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e9e4d5] text-[#6f7f5f]"><Flower2 className="h-5 w-5" /></span>
            <span className="flex-1">Ý định và bản sắc</span><ArrowRight className="h-5 w-5 text-[#85917f]" />
          </Link>
          <Link href="/store" className="flex min-h-16 items-center gap-4 rounded-3xl border border-[#dce3d5] bg-white/65 px-5 font-bold hover:bg-white">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ece6d7] text-[#7b7059]"><Store className="h-5 w-5" /></span>
            <span className="flex-1"><span className="block">Xưởng nhỏ</span><span className="font-normal text-xs text-[#7d8878]">Một góc phụ, không phải việc cần làm mỗi ngày</span></span><ArrowRight className="h-5 w-5 text-[#85917f]" />
          </Link>
          <Link href="/settings" className="flex min-h-16 items-center gap-4 rounded-3xl border border-[#dce3d5] bg-white/65 px-5 font-bold hover:bg-white">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e4e9df] text-[#66735f]"><Settings2 className="h-5 w-5" /></span>
            <span className="flex-1">Cài đặt</span><ArrowRight className="h-5 w-5 text-[#85917f]" />
          </Link>
        </section>

        <section className="mt-5 rounded-[2rem] border border-[#dce3d5] bg-white/55 p-5">
          <h2 className="mb-4 font-display text-xl font-semibold">Nhịp thời gian</h2>
          <TimezoneSelector currentTimezone={profile?.timezone || 'Asia/Ho_Chi_Minh'} />
        </section>
      </div>
    </main>
  )
}
