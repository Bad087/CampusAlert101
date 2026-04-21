import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import AlertCard, { Alert } from '../components/AlertCard';
import { doc, deleteDoc } from 'firebase/firestore';
import { Pencil, Trash2, Ghost } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      await deleteDoc(doc(db, 'alerts', id));
    }
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'alerts'),
      where('postedBy', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const myAlerts: Alert[] = [];
      snapshot.forEach(doc => myAlerts.push({ id: doc.id, ...doc.data() } as Alert));
      setAlerts(myAlerts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="min-h-full bg-[var(--color-brand-bg-primary)] pt-16 px-4">
      <div className="fixed top-0 inset-x-0 h-16 bg-[var(--color-brand-bg-card)]/80 backdrop-blur-md z-40 flex items-center px-4 border-b border-[var(--color-brand-divider)]">
        <h1 className="text-xl font-semibold text-white">My Alerts</h1>
      </div>

      {loading ? (
        <p className="text-[var(--color-brand-text-secondary)]">Loading...</p>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Ghost size={48} className="text-[var(--color-brand-text-secondary)] mb-4" />
          <p className="text-[var(--color-brand-text-secondary)]">You haven't posted anything yet.</p>
        </div>
      ) : (
        <div className="pt-4 space-y-4 pb-20">
          {alerts.map((alert, idx) => (
             <div key={alert.id} className="relative group">
                <AlertCard alert={alert} index={idx} />
                <div className="absolute top-4 right-10 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => navigate(`/post?edit=${alert.id}`)}
                    className="p-2 bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-accent-cyan)] rounded-full shadow-lg"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(alert.id)}
                    className="p-2 bg-[var(--color-brand-bg-surface)] text-red-500 rounded-full shadow-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
