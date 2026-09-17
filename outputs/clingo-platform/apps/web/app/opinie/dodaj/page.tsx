import { notFound, redirect } from "next/navigation";
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
  if (opinions.userReviews.some(item => item.id === reviewId)) redirect(`/opinie/edytuj?id=${reviewId}`);
  const review = opinions.pendingReviews.find(item => item.id === reviewId);
  if (!review) notFound();

  return (
    <DashboardShell active="Twoje opinie">
      <section className="min-w-0 w-full">
        <PageHeading
          description="Wystaw opinię po wykonanej usłudze."
          title="Dodaj opinię"
        />
      </section>
      <ReviewEditorModal mode="add" review={review} />
    </DashboardShell>
  );
}
