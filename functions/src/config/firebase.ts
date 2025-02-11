import * as admin from 'firebase-admin';

const db = admin.firestore();

export { db };

export const auth = admin.auth();
export const storage = admin.storage();

export default admin; 