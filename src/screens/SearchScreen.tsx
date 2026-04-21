import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import AlertCard, { Alert } from '../components/AlertCard';
import { useAuth } from '../contexts/AuthContext';

export default function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 3) {
        setLoading(true);
        try {
          // Simple client side filter because Firestore lacks full text search natively without extensions
          // In a real app we'd use Algolia. Here we fetch recent alerts and filter.
          const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(100));
          const snap = await getDocs(q);
          const allAlerts: Alert[] = [];
          snap.forEach(doc => allAlerts.push({id: doc.id, ...doc.data()} as Alert));
          
          const filtered = allAlerts.filter(a => 
             a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
             a.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setResults(filtered);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="min-h-full bg-[var(--color-brand-bg-primary)] p-4 pt-8">
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <SearchIcon size={20} className="text-[var(--color-brand-text-secondary)]" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search alerts..."
          className="w-full bg-[var(--color-brand-bg-card)] text-white rounded-full pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-accent-purple)] transition-all shadow-sm"
        />
        {loading && (
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
             <Loader2 size={18} className="animate-spin text-[var(--color-brand-accent-purple)]" />
          </div>
        )}
      </div>

      <div className="space-y-4">
        {searchTerm.length >= 3 && !loading && results.length === 0 && (
          <div className="text-center text-[var(--color-brand-text-secondary)] py-10">
             No results found for "{searchTerm}"
          </div>
        )}
        
        {results.map((alert, idx) => (
          <AlertCard key={alert.id} alert={alert} index={idx} />
        ))}
      </div>
    </div>
  );
}
