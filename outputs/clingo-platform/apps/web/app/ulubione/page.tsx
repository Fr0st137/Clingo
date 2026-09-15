import { DashboardShell } from "../../components/dashboard-shell";
import { FavoriteProviderCard } from "../../components/favorite-provider-card";
import { getFavorites } from "../../lib/api";

export default async function FavoritesPage() {
  const favorites = await getFavorites();

  return (
    <DashboardShell active="Ulubione">
      <section className="min-w-0 w-full">
        <header className="pb-5 md:h-[90px] md:pb-0 md:pt-[21px]">
          <h2 className="text-[22px] font-bold leading-5 text-clingo-ink">Ulubione</h2>
          <p className="mt-[13px] max-w-[560px] text-[14px] leading-5 text-clingo-muted">
            Twoi zapisani wykonawcy. Ulubione są dostępne po zalogowaniu na każdym urządzeniu.
          </p>
        </header>

        <section className="grid gap-[15px] md:mt-[10px] content-start md:w-full">
          {favorites.length === 0 && <p className="rounded-2xl border border-[#e6edf3] bg-white p-6 text-[14px] text-clingo-muted">Nie masz jeszcze ulubionych. Dodaj wykonawcę serduszkiem na liście ofert lub jego profilu.</p>}
          {favorites.map((provider) => (
            <FavoriteProviderCard key={provider.id} provider={provider} />
          ))}
        </section>
      </section>
    </DashboardShell>
  );
}
