/**
 * SparklesModalRenderer - Central modal orchestrator
 *
 * Renders the active modal based on store state.
 */

import { AnimatePresence } from 'framer-motion';
import { useSparklesStore } from '@/stores/sparklesStore';
import type { SparklesModal } from '@/types/sparkles';
import { SparklesAuthModal } from './SparklesAuthModal';
import { SparklesSettingsModal } from './SparklesSettingsModal';
import { SparklesSnoozeModal } from './SparklesSnoozeModal';
import { SparklesScheduleModal } from './SparklesScheduleModal';
import { SparklesLabelModal } from './SparklesLabelModal';
import { SparklesShortcutsModal } from './SparklesShortcutsModal';
import { SparklesCalendarModal } from './SparklesCalendarModal';
import { SparklesEventDetailsModal } from './SparklesEventDetailsModal';
import { SparklesCreateEventModal } from './SparklesCreateEventModal';
import { SparklesAccountsModal } from './SparklesAccountsModal';
import { SparklesAccountSettingsModal } from './SparklesAccountSettingsModal';
import { SparklesGatekeeperModal } from './SparklesGatekeeperModal';
import { SparklesAboutModal } from './SparklesAboutModal';

export function SparklesModalRenderer() {
    const { ui, closeModal } = useSparklesStore();

    if (!ui.activeModal) return null;

    return (
        <AnimatePresence mode="wait">
            {renderModal(ui.activeModal, closeModal)}
        </AnimatePresence>
    );
}

function renderModal(modal: SparklesModal, onClose: () => void) {
    switch (modal.type) {
        case 'add-account':
            return <SparklesAuthModal key="add-account" onClose={onClose} />;

        case 'settings':
            return <SparklesSettingsModal key="settings" onClose={onClose} />;

        case 'accounts':
            return <SparklesAccountsModal key="accounts" onClose={onClose} />;

        case 'account-settings':
            return modal.accountId ? (
                <SparklesAccountSettingsModal
                    key="account-settings"
                    accountId={modal.accountId}
                    onClose={onClose}
                />
            ) : null;

        case 'snooze':
            return modal.threadId ? (
                <SparklesSnoozeModal key="snooze" threadId={modal.threadId} onClose={onClose} />
            ) : null;

        case 'schedule-send':
            return modal.composeId ? (
                <SparklesScheduleModal key="schedule" composeId={modal.composeId} onClose={onClose} />
            ) : null;

        case 'calendar':
            return <SparklesCalendarModal key="calendar" initialDate={modal.date} onClose={onClose} />;

        case 'create-event':
            return <SparklesCreateEventModal key="create-event" initialDate={modal.date} onClose={onClose} />;

        case 'event-details':
            return modal.eventId ? (
                <SparklesEventDetailsModal key="event-details" eventId={modal.eventId} onClose={onClose} />
            ) : null;

        case 'gatekeeper':
            return <SparklesGatekeeperModal key="gatekeeper" onClose={onClose} />;

        case 'labels':
            return modal.threadId ? (
                <SparklesLabelModal key="labels" threadId={modal.threadId} onClose={onClose} />
            ) : null;

        case 'create-label':
            // Handled within SparklesLabelModal
            return null;

        case 'keyboard-shortcuts':
            return <SparklesShortcutsModal key="shortcuts" onClose={onClose} />;

        case 'about':
            return <SparklesAboutModal key="about" onClose={onClose} />;

        default:
            return null;
    }
}

export default SparklesModalRenderer;
