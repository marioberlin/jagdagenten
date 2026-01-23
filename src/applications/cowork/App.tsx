import { GlassCoworkApp } from '@/components/cowork/GlassCoworkApp';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';

export default function CoworkApp() {
  const closeApp = useAppStoreStore((s) => s.closeApp);
  return <GlassCoworkApp onClose={closeApp} />;
}
