/**
 * App Store UI Store
 *
 * Local state for the App Store UI (navigation, detail view, etc.)
 * This is separate from the system-level appStoreStore which manages
 * the actual app lifecycle.
 */

import { create } from 'zustand';

export type AppStoreView = 'home' | 'category' | 'detail' | 'search' | 'installed' | 'updates' | 'publish' | 'quick-app';

interface AppStoreUIState {
  /** Current view in the App Store */
  currentView: AppStoreView;

  /** Selected app ID for detail view */
  selectedAppId: string | null;

  /** Selected category for category view */
  selectedCategory: string | null;

  /** Search query */
  searchQuery: string;

  /** Whether the install confirmation dialog is open */
  showInstallDialog: boolean;
  installDialogAppId: string | null;

  /** Whether the uninstall confirmation dialog is open */
  showUninstallDialog: boolean;
  uninstallDialogAppId: string | null;
}

interface AppStoreUIActions {
  navigateTo: (view: AppStoreView, params?: { appId?: string; category?: string }) => void;
  setSearchQuery: (query: string) => void;
  showInstallConfirm: (appId: string) => void;
  hideInstallConfirm: () => void;
  showUninstallConfirm: (appId: string) => void;
  hideUninstallConfirm: () => void;
  goBack: () => void;
}

type AppStoreUIStore = AppStoreUIState & AppStoreUIActions;

export const useAppStoreUIStore = create<AppStoreUIStore>()((set, get) => ({
  currentView: 'home',
  selectedAppId: null,
  selectedCategory: null,
  searchQuery: '',
  showInstallDialog: false,
  installDialogAppId: null,
  showUninstallDialog: false,
  uninstallDialogAppId: null,

  navigateTo: (view, params) => {
    set({
      currentView: view,
      selectedAppId: params?.appId ?? null,
      selectedCategory: params?.category ?? null,
    });
  },

  setSearchQuery: (query) => {
    set({
      searchQuery: query,
      currentView: query.trim() ? 'search' : 'home',
    });
  },

  showInstallConfirm: (appId) => {
    set({ showInstallDialog: true, installDialogAppId: appId });
  },

  hideInstallConfirm: () => {
    set({ showInstallDialog: false, installDialogAppId: null });
  },

  showUninstallConfirm: (appId) => {
    set({ showUninstallDialog: true, uninstallDialogAppId: appId });
  },

  hideUninstallConfirm: () => {
    set({ showUninstallDialog: false, uninstallDialogAppId: null });
  },

  goBack: () => {
    const { currentView } = get();
    if (currentView === 'detail' || currentView === 'category' || currentView === 'quick-app') {
      set({ currentView: 'home', selectedAppId: null, selectedCategory: null });
    } else if (currentView === 'search') {
      set({ currentView: 'home', searchQuery: '' });
    }
  },
}));
