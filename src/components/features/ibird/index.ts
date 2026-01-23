/**
 * iBird - Re-export Shim
 * @deprecated Use '@/applications/ibird' directly.
 */

// Main App
export { IBirdApp } from '@/applications/ibird/IBirdApp';
export { IBirdApp as default } from '@/applications/ibird/IBirdApp';

// Shared Components
export { IBirdSidebar } from '@/applications/ibird/components/IBirdSidebar';
export { IBirdEmptyState } from '@/applications/ibird/components/IBirdEmptyState';
export { IBirdModals } from '@/applications/ibird/components/IBirdModals';

// Mail Components
export { IBirdMailView } from '@/applications/ibird/mail/IBirdMailView';
export { IBirdMessageList } from '@/applications/ibird/mail/IBirdMessageList';
export { IBirdMessageView } from '@/applications/ibird/mail/IBirdMessageView';
export { IBirdComposeModal } from '@/applications/ibird/mail/IBirdComposeModal';

// Calendar Components
export { IBirdCalendarView } from '@/applications/ibird/calendar/IBirdCalendarView';

// Appointments Components
export { IBirdAppointmentsView } from '@/applications/ibird/appointments/IBirdAppointmentsView';

// Hooks
export { useIBirdMenuBar } from '@/applications/ibird/hooks/useIBirdMenuBar';
export { useIBirdShortcuts } from '@/applications/ibird/hooks/useIBirdShortcuts';
export { useSettingsApi, useMailApi, useCalendarApi, useAppointmentsApi, usePublicBookingApi } from '@/applications/ibird/hooks/useIBirdApi';
