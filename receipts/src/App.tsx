import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import LoginPage from './pages/LoginPage';
import ReceiptList from './pages/ReceiptList';
import ScanReceipt from './pages/ScanReceipt';
import EditReceipt from './pages/EditReceipt';
import ManageUsers from './pages/ManageUsers';
import { Receipt } from './lib/types';

type Page =
  | 'list'
  | 'scan'
  | 'edit'
  | 'users';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('list');
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    return <LoginPage />;
  }

  switch (currentPage) {
    case 'list':
      return (
        <ReceiptList
          onNavigateToScan={() => setCurrentPage('scan')}
          onNavigateToUsers={() => setCurrentPage('users')}
          onNavigateToEdit={(receipt) => {
            setEditingReceipt(receipt);
            setCurrentPage('edit');
          }}
          onSignOut={() => setUser(null)}
        />
      );
    case 'scan':
      return <ScanReceipt onBackToList={() => setCurrentPage('list')} />;
    case 'edit':
      return editingReceipt ? (
        <EditReceipt
          receipt={editingReceipt}
          onBack={() => {
            setEditingReceipt(null);
            setCurrentPage('list');
          }}
        />
      ) : null;
    case 'users':
      return <ManageUsers onBack={() => setCurrentPage('list')} />;
    default:
      return null;
  }
}

export default App;
