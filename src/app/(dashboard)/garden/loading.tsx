export default function GardenLoading() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[linear-gradient(180deg,#f8e9bd_0%,#dce6c4_48%,#afc5a7_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(255,250,210,.85),transparent_30%)]" />
      <div className="absolute left-1/2 top-7 h-12 w-52 -translate-x-1/2 animate-pulse rounded-full border border-white/60 bg-[#fffaf0]/70 backdrop-blur-md" />

      <div className="absolute left-1/2 top-[54%] h-[42vw] max-h-[560px] min-h-[340px] w-[64vw] min-w-[620px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[7%] border border-white/40 bg-[#789566]/65 shadow-[0_30px_80px_rgba(62,74,50,.2)]">
        <div className="absolute inset-[8%] rounded-[6%] border border-white/20" />
        <div className="absolute left-[25%] top-[30%] size-16 animate-pulse rounded-[45%_55%_48%_52%] bg-[#adc18e]/70 shadow-[0_18px_22px_rgba(49,67,42,.18)] [animation-delay:150ms]" />
        <div className="absolute right-[24%] top-[20%] size-24 animate-pulse rounded-[55%_45%_60%_40%] bg-[#9eb77f]/70 shadow-[0_18px_22px_rgba(49,67,42,.18)] [animation-delay:300ms]" />
        <div className="absolute bottom-[24%] left-[48%] size-12 animate-pulse rounded-full bg-[#b7c995]/65 shadow-[0_18px_22px_rgba(49,67,42,.18)] [animation-delay:450ms]" />
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center text-[#4d6748]">
        <div className="mx-auto mb-3 flex items-end justify-center gap-1" aria-hidden="true">
          {[14, 22, 30].map((height, index) => (
            <span
              key={height}
              className="w-2 animate-pulse rounded-full bg-[#779565]"
              style={{ height, animationDelay: `${index * 140}ms` }}
            />
          ))}
        </div>
        <p className="text-sm font-semibold tracking-wide">Đang đánh thức khu vườn…</p>
      </div>
    </main>
  )
}
