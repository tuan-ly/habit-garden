export default function ReadingLoading() {
  return (
    <main className="relative h-full overflow-hidden bg-[linear-gradient(180deg,#f7efd8_0%,#dce9d6_100%)]">
      <div className="mx-auto w-full max-w-4xl px-4 pt-20 sm:px-6">
        <div className="mx-auto h-5 w-36 animate-pulse rounded-full bg-[#c8d6bd]" />
        <div className="mx-auto mt-4 h-10 w-72 animate-pulse rounded-2xl bg-[#b9cab0]" />
        <div className="mx-auto mt-10 grid max-w-3xl overflow-hidden rounded-[2rem] bg-white/65 shadow-xl md:grid-cols-2">
          <div className="min-h-[300px] animate-pulse bg-[#cad9bc]" />
          <div className="space-y-4 p-7">
            <div className="h-8 w-44 animate-pulse rounded-xl bg-[#dbe4d2]" />
            <div className="h-3 animate-pulse rounded-full bg-[#dbe4d2]" />
            <div className="h-20 animate-pulse rounded-2xl bg-[#e6ebdf]" />
            <div className="h-12 animate-pulse rounded-2xl bg-[#b8caaa]" />
          </div>
        </div>
        <p className="mt-6 text-center text-sm font-semibold text-[#607258]">
          Đang đánh thức cây đọc sách…
        </p>
      </div>
    </main>
  )
}

