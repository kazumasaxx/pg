import { FormEvent, useEffect, useState } from 'react';
import { Receipt } from '../lib/types';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Props = {
  receipt: Receipt;
  onBack: () => void;
};

function EditReceipt({ receipt, onBack }: Props) {
  const [formData, setFormData] = useState({
    date: receipt.date,
    vendor: receipt.vendor,
    category: receipt.category,
    amount: receipt.amount.toString(),
    reimbursement_type_id: receipt.reimbursement_type_id || '',
    reimbursement_user_id: receipt.reimbursement_user_id || '',
    is_reimbursed: receipt.is_reimbursed,
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [reimbursementTypes, setReimbursementTypes] = useState<any[]>([]);
  const [reimbursementUsers, setReimbursementUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, typeRes, userRes] = await Promise.all([
        supabase.from('category_settings').select('*').order('name'),
        supabase.from('reimbursement_types').select('*').order('name'),
        supabase.from('reimbursement_users').select('*').order('username'),
      ]);
      if (!catRes.error) setCategories(catRes.data || []);
      if (!typeRes.error) setReimbursementTypes(typeRes.data || []);
      if (!userRes.error) setReimbursementUsers(userRes.data || []);
    };

    fetchData();
  }, []);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const amount = parseInt(formData.amount);
      const { error } = await supabase
        .from('receipts')
        .update({
          date: formData.date,
          vendor: formData.vendor,
          category: formData.category,
          amount: amount,
          reimbursement_type_id: formData.reimbursement_type_id || null,
          reimbursement_user_id: formData.reimbursement_user_id || null,
          is_reimbursed: formData.is_reimbursed,
        })
        .eq('id', receipt.id);

      if (error) throw error;

      toast.success('更新しました');
      onBack();
    } catch (error) {
      toast.error('更新に失敗しました');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-gray-50 min-h-screen">
      <button onClick={onBack} className="text-blue-600 hover:underline mb-4">
        ← 戻る
      </button>
      <h1 className="text-xl font-bold mb-6">領収書の編集</h1>

      <form onSubmit={handleUpdate} className="space-y-4 bg-white p-6 rounded shadow">
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
        <Input
          type="text"
          placeholder="取引先"
          value={formData.vendor}
          onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
          required
        />

        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 rounded border text-sm"
          required
        >
          <option value="">勘定科目を選択</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        <Input
          type="number"
          placeholder="金額"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />

        <select
          value={formData.reimbursement_type_id}
          onChange={(e) =>
            setFormData({ ...formData, reimbursement_type_id: e.target.value })
          }
          className="w-full px-3 py-2 rounded border text-sm"
        >
          <option value="">立替種別を選択</option>
          {reimbursementTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>

        <select
          value={formData.reimbursement_user_id}
          onChange={(e) =>
            setFormData({ ...formData, reimbursement_user_id: e.target.value })
          }
          className="w-full px-3 py-2 rounded border text-sm"
        >
          <option value="">立替者を選択</option>
          {reimbursementUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isReimbursed"
            checked={formData.is_reimbursed}
            onChange={(e) =>
              setFormData({ ...formData, is_reimbursed: e.target.checked })
            }
          />
          <label htmlFor="isReimbursed" className="text-sm text-gray-700">
            精算済み
          </label>
        </div>

        <Button type="submit" className="w-full bg-blue-600 text-white" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              更新中...
            </>
          ) : (
            '更新する'
          )}
        </Button>
      </form>
    </div>
  );
}

export default EditReceipt;
