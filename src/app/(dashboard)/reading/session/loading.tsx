export default function FocusSessionLoading() {
  return (
    <main className="grid h-full place-items-center bg-[linear-gradient(180deg,#f7efd8,#dce9d6)] px-4">
      <div className="w-full max-w-xl rounded-[2rem] bg-white/70 p-8 text-center shadow-xl">
        <div className="mx-auto h-5 w-28 animate-pulse rounded-full bg-[#c8d7bd]" />
        <div className="mx-auto mt-7 h-20 w-64 animate-pulse rounded-3xl bg-[#bdcdb2]" />
        <div className="mt-8 h-3 animate-pulse rounded-full bg-[#d9e3d2]" />
        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-2xl bg-[#e3e9dd]" />
          <div className="h-24 animate-pulse rounded-2xl bg-[#e3e9dd]" />
        </div>
        <p className="mt-6 text-sm font-semibold text-[#61735a]">Đang khôi phục timer…</p>
      </div>
    </main>
  )
}

