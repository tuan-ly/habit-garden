import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Leaf, Moon, Sprout } from 'lucide-react'
import { getAuthUser } from '@/lib/auth'
import { PaddleScript } from '@/components/landing/paddle-script'

export default async function Home() {
  const user = await getAuthUser()

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf6e9] text-[#30482b]">
      <PaddleScript />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Habien',
            applicationCategory: 'HealthApplication',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            description: 'A calm garden where small daily actions become visible growth.',
          }),
        }}
      />

      <section className="relative min-h-[94dvh] overflow-hidden">
        <Image
          src="/garden/backgrounds/sanctuary-golden-hour.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#fbf6e9]/65 via-[#fbf6e9]/10 to-[#fbf6e9]" />

        <div className="relative mx-auto flex min-h-[94dvh] max-w-6xl flex-col px-5 pb-14 pt-5 sm:px-8">
          <nav className="flex items-center justify-between rounded-full border border-white/65 bg-[#fffaf0]/80 px-4 py-2.5 shadow-[0_12px_35px_rgba(45,72,40,0.12)] backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#dfe9d3]"><Leaf className="h-5 w-5 text-[#5f854f]" /></span>
              Habien
            </Link>
            <div className="flex items-center gap-2">
              {!user && <Link href="/login" className="hidden min-h-11 items-center px-4 text-sm font-bold text-[#55704c] sm:flex">Đăng nhập</Link>}
              <Link href={user ? '/garden' : '/signup'} className="flex min-h-11 items-center rounded-full bg-[#5f854f] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(67,105,55,0.22)] hover:bg-[#527644]">
                {user ? 'Vào vườn' : 'Gieo hạt đầu tiên'}
              </Link>
            </div>
          </nav>

          <div className="my-auto grid items-center gap-10 py-14 lg:grid-cols-[1fr_0.86fr]">
            <div className="max-w-2xl">
              <p className="mb-5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#607858]">
                <Leaf className="h-4 w-4" /> Một khu vườn cho những ngày thật
              </p>
              <h1 className="font-display text-5xl font-semibold leading-[1.03] tracking-[-0.045em] text-[#294524] sm:text-7xl">
                Nuôi một nhịp sống,
                <span className="block italic text-[#6e8e5f]">không nuôi áp lực.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#5f705a] sm:text-xl">
                Biến mỗi lần đọc sách, vận động hay nghỉ ngơi đúng lúc thành một thay đổi bạn có thể nhìn thấy trong khu vườn của riêng mình.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={user ? '/garden' : '/signup'} className="flex min-h-14 items-center justify-center rounded-full bg-[#5f854f] px-7 text-base font-extrabold text-white shadow-[0_14px_28px_rgba(67,105,55,0.24)] hover:-translate-y-0.5 hover:bg-[#527644]">
                  {user ? 'Trở lại khu vườn' : 'Bắt đầu miễn phí'} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a href="#how" className="flex min-h-14 items-center justify-center rounded-full border border-[#cbd8c1] bg-[#fffaf0]/75 px-7 font-bold text-[#4f6a47] backdrop-blur hover:bg-white">
                  Xem cách khu vườn lớn lên
                </a>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#6f7e69]"><Check className="h-4 w-4" /> Không phạt chuỗi ngày · Không cây chết · Không tạo cảm giác tội lỗi</p>
            </div>

            <div className="relative mx-auto w-full max-w-sm lg:mr-0">
              <div className="rounded-[2.6rem] border border-white/70 bg-[#fffaf0]/82 p-4 shadow-[0_32px_80px_rgba(38,66,34,0.2)] backdrop-blur-xl">
                <div className="rounded-[2rem] bg-[#dfe9d3]/80 px-5 pb-5 pt-6 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#778a70]">Hôm nay trong vườn</p>
                  <div className="relative mx-auto my-1 h-40 w-40 drop-shadow-[0_14px_16px_rgba(49,75,43,0.18)]">
                    <Image src="/plants/cactus/04-blooming.png" alt="Cây xương rồng đang nở hoa" fill sizes="160px" className="object-contain" />
                  </div>
                  <h2 className="font-display text-3xl font-semibold">Đọc 10 trang</h2>
                  <p className="mt-1 text-sm text-[#71806c]">Chỉ cần một bước nhỏ</p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm font-bold">
                  <span className="rounded-2xl bg-[#edf1e7] px-2 py-3 text-[#5d7156]">2 phút</span>
                  <span className="rounded-2xl bg-[#5f854f] px-2 py-3 text-white">Đã làm</span>
                  <span className="rounded-2xl bg-[#edf1e7] px-2 py-3 text-[#5d7156]">Nghỉ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#74886b]">Vòng lặp dịu dàng</p>
          <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Mỗi lần quay lại đều để lại dấu vết</h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            { icon: Sprout, title: 'Chọn một điều nhỏ', body: 'Một cây đại diện cho điều bạn muốn trở thành, không phải một ô việc phải hoàn thành.' },
            { icon: Leaf, title: 'Ghi nhận sự hiện diện', body: 'Đã làm, chỉ hai phút, hay nghỉ hôm nay — cả ba đều là những lựa chọn hợp lệ.' },
            { icon: Moon, title: 'Nhìn khu vườn đáp lại', body: 'Cây lớn, ánh sáng đổi và hành trình dần kể lại cách bạn đã sống.' },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-[2rem] border border-[#dce3d3] bg-white/65 p-7 shadow-[0_16px_40px_rgba(53,79,47,0.07)]">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#dfe9d3] text-[#5f854f]"><Icon className="h-6 w-6" /></div>
              <h3 className="mt-5 font-display text-2xl font-semibold">{title}</h3>
              <p className="mt-3 leading-7 text-[#687563]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-4 mb-8 rounded-[2.5rem] bg-[#314f2c] px-6 py-16 text-center text-[#fffaf0] sm:mx-8">
        <h2 className="font-display text-4xl font-semibold sm:text-5xl">Gieo một hạt đủ nhỏ cho hôm nay.</h2>
        <p className="mx-auto mt-4 max-w-xl text-[#d7e4cf]">Ngày mai, khu vườn sẽ cho bạn một lý do dịu dàng để quay lại.</p>
        <Link href={user ? '/garden' : '/signup'} className="mt-8 inline-flex min-h-14 items-center rounded-full bg-[#f0c47a] px-7 font-extrabold text-[#314f2c] hover:bg-[#f7d493]">
          {user ? 'Vào khu vườn' : 'Tạo khu vườn của tôi'} <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </section>

      <footer className="flex flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-[#73806e] sm:flex-row">
        <span>© 2026 Habien · Lớn lên theo nhịp của bạn.</span>
        <div className="flex gap-5"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refund">Refunds</Link></div>
      </footer>
    </main>
  )
}
