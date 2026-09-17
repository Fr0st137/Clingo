import { DashboardShell } from "../../components/dashboard-shell";
import { PageHeading } from "../../components/page-heading";
import { PendingReviewCard, ReviewCard } from "../../components/review-card";
import { getOpinions } from "../../lib/api";

export default async function OpinionsPage() {
  const opinions = await getOpinions();

  return (
    <DashboardShell active="Twoje opinie">
      <section className="min-w-0 w-full">
        <PageHeading
          description="Sprawdzaj opinie, które pozostawiłeś innym wykonawcom."
          title="Twoje opinie"
        />

        <section className="grid gap-5 md:mt-[10px] md:max-w-[745px]">
          <div>
            <h3 className="mb-3 text-[14px] font-bold text-clingo-ink">Usługi do oceny</h3>
            <div className="grid gap-3">
              {opinions.pendingReviews.length === 0 && <p className="text-[14px] text-clingo-muted">Nie masz usług oczekujących na ocenę. Pojawią się tutaj po oznaczeniu zamówienia jako wykonane.</p>}
              {opinions.pendingReviews.map((item) => (
                <PendingReviewCard item={item} key={item.id} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[14px] font-bold text-clingo-ink">Ocenione</h3>
            <div className="grid gap-5">
              {opinions.userReviews.length === 0 && <p className="text-[14px] text-clingo-muted">Nie wystawiono jeszcze żadnej opinii.</p>}
              {opinions.userReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        </section>
      </section>
    </DashboardShell>
  );
}
