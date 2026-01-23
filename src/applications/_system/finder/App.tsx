import { GlassFinderApp } from '@/components/features/GlassFinderApp';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';

export default function FinderApp() {
  const closeApp = useAppStoreStore((s) => s.closeApp);
  return <GlassFinderApp onClose={closeApp} />;
}
