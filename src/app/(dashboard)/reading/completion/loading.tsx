export default function CompletionLoading() {
  return (
    <main className="grid h-full place-items-center bg-[linear-gradient(180deg,#f7efd8,#dce9d6)] px-4">
      <div className="w-full max-w-xl rounded-[2rem] bg-white/70 p-8 text-center shadow-xl">
        <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-[#c3d6b7]" />
        <div className="mx-auto mt-5 h-8 w-64 animate-pulse rounded-2xl bg-[#cbd8c2]" />
        <div className="mx-auto mt-3 h-5 w-80 max-w-full animate-pulse rounded-xl bg-[#dde5d6]" />
        <div className="mt-8 h-14 animate-pulse rounded-2xl bg-white/80" />
        <div className="mt-5 h-28 animate-pulse rounded-2xl bg-white/80" />
        <p className="mt-6 text-sm font-semibold text-[#61735a]">Đang mở sổ phiên đọc…</p>
      </div>
    </main>
  )
}

