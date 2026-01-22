/**
 * iBird - Email, Calendar & Appointments System
 *
 * A comprehensive productivity app with:
 * - Email management (IMAP/SMTP)
 * - Calendar with multi-source sync
 * - Appointment scheduling (Calendly-like)
 */

// Main App
export { IBirdApp, default } from './IBirdApp';

// Shared Components
export { IBirdSidebar } from './IBirdSidebar';
export { IBirdEmptyState } from './IBirdEmptyState';
export { IBirdModals } from './IBirdModals';

// Mail Components
export { IBirdMailView } from './mail/IBirdMailView';
export { IBirdMessageList } from './mail/IBirdMessageList';
export { IBirdMessageView } from './mail/IBirdMessageView';
export { IBirdComposeModal } from './mail/IBirdComposeModal';

// Calendar Components
export { IBirdCalendarView } from './calendar/IBirdCalendarView';

// Appointments Components
export { IBirdAppointmentsView } from './appointments/IBirdAppointmentsView';

// Hooks
export { useIBirdMenuBar } from './hooks/useIBirdMenuBar';
export { useIBirdShortcuts } from './hooks/useIBirdShortcuts';
export { useSettingsApi, useMailApi, useCalendarApi, useAppointmentsApi, usePublicBookingApi } from './hooks/useIBirdApi';
