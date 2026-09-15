import Link from "next/link";
import { FavoriteButton } from "./favorite-button";
export type FavoriteProviderData = { id: string; name: string; completedServices: number; rating: number; reviews: number; experience: string; };
export function FavoriteProviderCard({ provider }: { provider: FavoriteProviderData }) {
  return <article className="w-full max-w-[745px] rounded-[20px] border border-[#e6edf3] bg-white shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
    <div className="flex items-start gap-4 p-5">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#e9f5ff] text-lg font-bold text-[#0079de]">{provider.name.split(/\s+/).slice(0,2).map(part => part[0]).join("")}</span>
      <div className="min-w-0 flex-1"><Link href={`/wykonawcy/${provider.id}`} className="text-[16px] font-bold text-clingo-ink">{provider.name}</Link>
        <p className="mt-2 text-[13px] text-clingo-muted">{provider.completedServices} wykonanych usług · {provider.experience} doświadczenia</p>
        <Link href={`/wykonawcy/${provider.id}#opinie`} className="mt-2 block text-[13px] text-[#0079de]">★ {provider.rating.toFixed(1)} · {provider.reviews} ocen</Link>
      </div><FavoriteButton providerId={provider.id} initial />
    </div><Link href={`/profil-ogloszeniowy/${provider.id}`} className="flex justify-between border-t border-[#e6edf3] px-5 py-3 text-[14px] font-medium text-[#0079de]">Zobacz ofertę <span aria-hidden>→</span></Link>
  </article>;
}
