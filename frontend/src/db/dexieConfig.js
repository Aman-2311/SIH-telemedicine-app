import Dexie from 'dexie';

export const db = new Dexie('TelemedicineDB');

db.version(1).stores({
    offline_intakes: '++id, abha_id, timestamp, sync_status'
});
