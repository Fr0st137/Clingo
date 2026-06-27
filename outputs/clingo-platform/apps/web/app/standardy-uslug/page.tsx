import { DashboardShell } from "../../components/dashboard-shell";
import { PageHeading } from "../../components/page-heading";
import { ReviewCard } from "../../components/review-card";
import { standardsReviews } from "../../lib/panel-mock-data";

export default function ServiceStandardsPage() {
  return (
    <DashboardShell active="Standardy usług Clingo">
      <section className="w-full md:w-[1090px]">
        <PageHeading
          description="Sprawdzaj opinie pozostawione przez klientów po wykonanych zleceniach."
          title="Standardy usług Clingo"
        />

        <section className="grid gap-5 md:mt-[10px] md:max-w-[745px]">
          {standardsReviews.map((review) => (
            <ReviewCard key={review.id} review={review} showAuthor />
          ))}
        </section>
      </section>
    </DashboardShell>
  );
}
