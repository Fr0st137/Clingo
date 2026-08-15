import { AuthView } from "../../components/auth-view";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined> | undefined, key: string) {
  const value = params?.[key];
  return typeof value === "string" ? value : undefined;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const mode = getParam(params, "mode") === "register" ? "register" : "login";
  const nextPath = getParam(params, "next");

  return <AuthView initialMode={mode} nextPath={nextPath} />;
}
