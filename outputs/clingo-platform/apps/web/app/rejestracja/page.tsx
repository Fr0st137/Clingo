import { AuthView } from "../../components/auth-view";

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const nextValue = params?.next;
  const nextPath = typeof nextValue === "string" ? nextValue : undefined;

  return <AuthView initialMode="register" nextPath={nextPath} />;
}
