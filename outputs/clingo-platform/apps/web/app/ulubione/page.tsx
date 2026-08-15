import { DashboardShell } from "../../components/dashboard-shell";
import { FavoriteProviderCard } from "../../components/favorite-provider-card";
import { getFavorites } from "../../lib/api";

export default async function FavoritesPage() {
  const favorites = await getFavorites();

  return (
    <DashboardShell active="Ulubione">
      <section className="w-full md:w-[1090px]">
        <header className="pb-5 md:h-[90px] md:pb-0 md:pt-[21px]">
          <h2 className="text-[22px] font-bold leading-5 text-clingo-ink">Ulubione</h2>
          <p className="mt-[13px] max-w-[560px] text-[14px] leading-5 text-clingo-muted">
            Sprawdzaj opinie pozostawione przez klientów po wykonanych zleceniach.
          </p>
        </header>

        <section className="grid gap-[15px] md:mt-[10px] md:min-h-[821px] md:w-[1090px]">
          {favorites.map((provider) => (
            <FavoriteProviderCard key={provider.id} provider={provider} />
          ))}
        </section>
      </section>
    </DashboardShell>
  );
}
