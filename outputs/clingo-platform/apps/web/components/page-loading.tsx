import { Topbar } from "./topbar";

export function PageLoading() {
  return (
    <>
      <Topbar />
      <main aria-busy="true" className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-10 pt-[122px] md:pt-[100px]">
        <section role="status" aria-live="polite" className="rounded-[30px] border border-[#e5e7eb] bg-white p-[30px] shadow-[0_4px_18px_rgba(15,23,42,0.08)]">
          <p className="m-0 text-[16px] font-medium text-[#2e3b4c]">Ładowanie strony…</p>
          <div aria-hidden="true" className="mt-6 grid gap-4 motion-safe:animate-pulse">
            <div className="h-5 w-1/3 rounded-full bg-[#e6edf3]" />
            <div className="h-4 w-2/3 rounded-full bg-[#f4f6f9]" />
            <div className="h-[180px] rounded-[20px] bg-[#f4f6f9]" />
          </div>
        </section>
      </main>
    </>
  );
}
