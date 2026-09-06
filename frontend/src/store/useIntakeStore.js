import { create } from 'zustand';
import { db } from '../db/dexieConfig';
import api from '../utils/api';

const useIntakeStore = create((set, get) => ({
    patientData: {
        abha_id: '',
        voice_note_text: '',
        vitals: {
            bp: '',
            temp: '',
            pulse: ''
        },
        image_url: ''
    },
    isOffline: !navigator.onLine,
    
    updateField: (field, value) => {
        set((state) => {
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                return {
                    patientData: {
                        ...state.patientData,
                        [parent]: {
                            ...state.patientData[parent],
                            [child]: value
                        }
                    }
                };
            }
            return {
                patientData: {
                    ...state.patientData,
                    [field]: value
                }
            };
        });
    },

    setOfflineStatus: (status) => set({ isOffline: status }),

    submitIntake: async () => {
        const data = get().patientData;
        const payload = {
            ...data,
            timestamp: new Date().toISOString()
        };

        try {
            const response = await api.post('/api/intake', payload);
            set({ isOffline: false });
            return response.data;
        } catch (error) {
            console.error("Network request failed, saving offline...", error);
            
            await db.offline_intakes.add({
                ...payload,
                sync_status: 'pending'
            });
            
            set({ isOffline: true });
            return { status: 'offline_saved', message: 'Data saved locally due to network error.' };
        }
    }
}));

window.addEventListener('online', () => useIntakeStore.getState().setOfflineStatus(false));
window.addEventListener('offline', () => useIntakeStore.getState().setOfflineStatus(true));

export default useIntakeStore;
