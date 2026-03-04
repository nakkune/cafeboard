import { create } from 'zustand';
import { api } from '../api';

interface SystemSettings {
    site_name: string;
    maintenance_mode: string;
    terms_of_service: string;
    privacy_policy: string;
}

interface SettingsState {
    settings: SystemSettings;
    isLoading: boolean;
    fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    settings: {
        site_name: 'CafeBoard',
        maintenance_mode: 'false',
        terms_of_service: '',
        privacy_policy: ''
    },
    isLoading: false,

    fetchSettings: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/config/settings');
            set({ settings: response.data, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch global settings:', error);
            set({ isLoading: false });
        }
    },
}));
