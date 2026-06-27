import { DashboardShell } from "../../components/dashboard-shell";
import { PageHeading } from "../../components/page-heading";
import { PendingReviewCard, ReviewCard } from "../../components/review-card";
import { pendingReviews, userReviews } from "../../lib/panel-mock-data";

export default function OpinionsPage() {
  return (
    <DashboardShell active="Twoje opinie">
      <section className="w-full md:w-[1090px]">
        <PageHeading
          description="Sprawdzaj opinie, które pozostawiłeś innym wykonawcom."
          title="Twoje opinie"
        />

        <section className="grid gap-5 md:mt-[10px] md:max-w-[745px]">
          <div>
            <h3 className="mb-3 text-[14px] font-bold text-clingo-ink">Ostatnie</h3>
            <div className="grid gap-3">
              {pendingReviews.map((item) => (
                <PendingReviewCard item={item} key={item.id} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[14px] font-bold text-clingo-ink">Ocenione</h3>
            <div className="grid gap-5">
              {userReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        </section>
      </section>
    </DashboardShell>
  );
}
