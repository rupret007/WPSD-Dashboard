import { AppHeader } from "@/components/AppHeader";
import { MMDVMConfigForm } from "@/components/config/MMDVMConfigForm";
import { SettingsPanel } from "@/components/config/SettingsPanel";
import { TGIFPanel } from "@/components/config/TGIFPanel";
import { AdminPanel } from "@/components/config/AdminPanel";

export default function ConfigPage() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <AppHeader
        title="Configuration"
        subtitle="MMDVM config, Settings, TGIF, Admin Actions"
      />

      <div className="space-y-6 max-w-2xl">
        <SettingsPanel />
        <MMDVMConfigForm />
        <TGIFPanel />
        <AdminPanel />
      </div>
    </div>
  );
}
