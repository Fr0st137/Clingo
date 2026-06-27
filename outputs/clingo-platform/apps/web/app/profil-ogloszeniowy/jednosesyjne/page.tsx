import { ProviderProfileView } from "../../../components/provider-profile-view";
import { PublicShell } from "../../../components/public-shell";
import { providerProfile } from "../../../lib/provider-profile-mock-data";

export default function SingleSessionProviderProfilePage() {
  return (
    <PublicShell>
      <ProviderProfileView profile={providerProfile} />
    </PublicShell>
  );
}
