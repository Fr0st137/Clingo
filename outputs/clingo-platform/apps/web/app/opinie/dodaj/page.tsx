import { DashboardShell } from "../../../components/dashboard-shell";
import { PageHeading } from "../../../components/page-heading";
import { ReviewEditorModal } from "../../../components/review-editor-modal";
import { getOpinions } from "../../../lib/api";

type AddReviewPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined> | undefined, key: string) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AddReviewRoute({ searchParams }: AddReviewPageProps) {
  const params = await searchParams;
  const reviewId = getParam(params, "id");
  const opinions = await getOpinions();
  const pendingReview = opinions.pendingReviews.find((review) => review.id === reviewId) ?? opinions.pendingReviews[0];
  const review = pendingReview ?? {
    avatarTone: "person" as const,
    id: "missing-review",
    person: "Wykonawca",
    service: "Usługa do oceny"
  };

  return (
    <DashboardShell active="Twoje opinie">
      <section className="w-full md:w-[1090px]">
        <PageHeading
          description="Wystaw opinię po wykonanej usłudze."
          title="Dodaj opinię"
        />
      </section>
      <ReviewEditorModal mode="add" review={review} />
    </DashboardShell>
  );
}
