import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { FileDown, LogOut, Pencil, Upload, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Receipt } from '../lib/types';

type Props = {
  onNavigateToScan: () => void;
  onNavigateToUsers: () => void;
  onNavigateToEdit: (receipt: Receipt) => void;
  onSignOut: () => void;
};

function ReceiptList({
  onNavigateToScan,
  onNavigateToUsers,
  onNavigateToEdit,
  onSignOut
}: Props) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const fetchReceipts = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      toast.error('領収書の取得に失敗しました');
      return;
    }
    setReceipts(data || []);
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
    toast.success('ログアウトしました');
  };

  const handleExportCSV = () => {
    const headers = ['日付', '取引先', '勘定科目', '金額'];
    const rows = receipts.map(
      (r) => `${r.date},${r.vendor},${r.category},${r.amount}`
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'receipts.csv';
    link.click();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">領収書一覧</h1>
        <div className="flex gap-2">
          <Button
            onClick={onNavigateToScan}
            className="bg-blue-600 text-white flex items-center gap-1"
          >
            <Upload className="w-4 h-4" />
            読み取り
          </Button>
          <Button
            onClick={onNavigateToUsers}
            className="bg-green-600 text-white flex items-center gap-1"
          >
            <Users className="w-4 h-4" />
            立替者管理
          </Button>
          <Button
            onClick={handleExportCSV}
            className="flex items-center gap-1"
            disabled={receipts.length === 0}
          >
            <FileDown className="w-4 h-4" />
            CSV出力
          </Button>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </Button>
        </div>
      </div>

      {receipts.length === 0 ? (
        <div className="bg-white p-8 rounded shadow text-center text-gray-500">
          領収書が登録されていません。
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">日付</th>
                <th className="px-4 py-2 text-left">取引先</th>
                <th className="px-4 py-2 text-left">勘定科目</th>
                <th className="px-4 py-2 text-right">金額</th>
                <th className="px-4 py-2 text-center">編集</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr
                  key={receipt.id}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-2">{receipt.date}</td>
                  <td className="px-4 py-2">{receipt.vendor}</td>
                  <td className="px-4 py-2">{receipt.category}</td>
                  <td className="px-4 py-2 text-right">
                    ¥{receipt.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Button
                      variant="ghost"
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => onNavigateToEdit(receipt)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ReceiptList;
