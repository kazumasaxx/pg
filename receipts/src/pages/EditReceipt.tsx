import { FormEvent, useState, useEffect } from 'react';
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
  });
  const [isLoading, setIsLoading] = useState(false);

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
        <Input
          type="text"
          placeholder="勘定科目"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
        />
        <Input
          type="number"
          placeholder="金額"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />
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
