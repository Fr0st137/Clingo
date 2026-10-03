import { ProviderServiceConfigPage } from "../../../components/provider-service-config-page";

export const metadata = { title: "Konfiguracja usługi | Panel wykonawcy Clingo" };

export default async function ServiceConfigPage({ params }: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await params;
  return <ProviderServiceConfigPage serviceId={serviceId} />;
}
