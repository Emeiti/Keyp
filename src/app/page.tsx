import { adminDb } from '../lib/firebase-admin';
import { Store } from '../types/store';
import StoreList from '../components/StoreList';

export default async function HomePage() {
  const storesSnapshot = await adminDb.collection('stores').get();
  const stores = storesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Store));

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Keyp.fo Store Directory</h1>
      <StoreList stores={stores} />
    </main>
  );
} 