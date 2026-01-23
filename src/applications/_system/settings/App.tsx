import { GlassSettingsApp } from '@/components/settings/GlassSettingsApp';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';

export default function SettingsApp() {
  const closeApp = useAppStoreStore((s) => s.closeApp);
  return <GlassSettingsApp onClose={closeApp} />;
}
