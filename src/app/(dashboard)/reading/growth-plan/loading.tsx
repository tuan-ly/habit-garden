export default function GrowthPlanLoading() {
  return (
    <main className="h-full overflow-hidden bg-[linear-gradient(180deg,#f7efd8,#dce9d6)] px-4 pt-24">
      <div className="mx-auto w-full max-w-3xl rounded-[2rem] bg-white/70 p-6 shadow-xl">
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl bg-[#dce5d5]" />
          ))}
        </div>
        <div className="mt-8 h-12 animate-pulse rounded-full bg-[#cbd8c2]" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-[#e3e9dd]" />
          <div className="h-40 animate-pulse rounded-2xl bg-[#e3e9dd]" />
        </div>
        <p className="mt-6 text-center text-sm font-semibold text-[#61735a]">Đang vẽ quỹ đạo…</p>
      </div>
    </main>
  )
}

