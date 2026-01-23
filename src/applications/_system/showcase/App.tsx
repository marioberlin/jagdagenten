import { GlassShowcaseApp } from '@/components/settings/GlassShowcaseApp';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';

export default function ShowcaseApp() {
  const closeApp = useAppStoreStore((s) => s.closeApp);
  return <GlassShowcaseApp onClose={closeApp} />;
}
