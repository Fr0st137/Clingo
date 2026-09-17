"use client";
import Link from "next/link";
export function AccountError({ reset }: { reset: () => void }) {
  return <main className="relative z-10 mx-auto mt-32 max-w-lg rounded-2xl border bg-white p-8 text-clingo-ink"><h1 className="text-xl font-bold">Nie można wczytać danych konta</h1><p className="mt-3">Sprawdź połączenie i spróbuj ponownie. Twoje zapisane dane pozostają w bazie.</p><div className="mt-5 flex gap-4"><button className="rounded-full bg-[#0079de] px-5 py-3 text-white" onClick={reset}>Spróbuj ponownie</button><Link className="px-3 py-3 text-[#0079de]" href="/logowanie">Zaloguj się</Link></div></main>;
}
