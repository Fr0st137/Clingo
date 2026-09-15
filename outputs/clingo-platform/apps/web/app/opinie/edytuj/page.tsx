import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "../../../components/dashboard-shell";
import { PageHeading } from "../../../components/page-heading";
import { ReviewEditorModal } from "../../../components/review-editor-modal";
import { getOpinions } from "../../../lib/api";

type EditReviewPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined> | undefined, key: string) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditReviewRoute({ searchParams }: EditReviewPageProps) {
  const params = await searchParams;
  const reviewId = getParam(params, "id");
  const opinions = await getOpinions();
  const review = opinions.userReviews.find(item => item.id === reviewId);
  if (!review) notFound();

  return (
    <DashboardShell active="Twoje opinie">
      <section className="min-w-0 w-full">
        <PageHeading
          description="Edytuj opinię wystawioną po usłudze."
          title="Edytuj opinię"
        />
      </section>
      <ReviewEditorModal mode="edit" review={review} />
    </DashboardShell>
  );
}
