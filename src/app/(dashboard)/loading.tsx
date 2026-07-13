export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#f7f2e6]">
      <div className="text-center text-[#4d6748]">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-[1.5rem] border border-[#d8e1c9] bg-[#edf3df] shadow-[0_12px_30px_rgba(77,103,72,.12)]">
          <div className="size-6 animate-pulse rounded-[70%_30%_65%_35%] bg-[#7d9d68]" />
        </div>
        <p className="text-sm font-semibold tracking-wide">Đang chuẩn bị khu vườn…</p>
      </div>
    </div>
  )
}
