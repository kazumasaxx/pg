import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

type Props = {
  onBack: () => void;
};

function ManageUsers({ onBack }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('reimbursement_users').select('*').order('username');
    if (error) {
      toast.error('取得に失敗しました');
      return;
    }
    setUsers(data);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('reimbursement_users').insert({ username: newUsername.trim() });
      if (error) throw error;
      toast.success('追加しました');
      setNewUsername('');
      await fetchUsers();
    } catch (error) {
      toast.error('追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('reimbursement_users').delete().eq('id', id);
      if (error) throw error;
      toast.success('削除しました');
      await fetchUsers();
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto bg-gray-50 min-h-screen">
      <button onClick={onBack} className="text-blue-600 hover:underline mb-4 flex items-center">
        <ArrowLeft className="w-4 h-4 mr-1" /> 戻る
      </button>
      <h1 className="text-xl font-bold mb-6">立替者の管理</h1>

      <form onSubmit={handleAdd} className="flex gap-4 mb-6">
        <Input
          type="text"
          placeholder="立替者名"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          required
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              追加中
            </>
          ) : (
            '追加'
          )}
        </Button>
      </form>

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white p-4 rounded shadow flex justify-between items-center"
          >
            <span>{user.username}</span>
            <Button
              variant="outline"
              className="text-red-600"
              onClick={() => handleDelete(user.id)}
            >
              削除
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageUsers;
