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
  const [filtered, setFiltered] = useState<Receipt[]>([]);
  const [showReimbursedOnly, setShowReimbursedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchReceipts = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('receipts')
      .select(`
        *,
        reimbursement_types:reimbursement_type_id(name),
        reimbursement_users:reimbursement_user_id(username)
      `)
      .eq('user_id', userId);

    if (error) {
      toast.error('領収書の取得に失敗しました');
      return;
    }

    setReceipts(data || []);
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  useEffect(() => {
    let result = [...receipts];

    if (showReimbursedOnly) {
      result = result.filter((r) => r.is_reimbursed);
    }

    result.sort((a, b) => {
      const valueA = sortKey === 'date' ? new Date(a.date).getTime() : a.amount;
      const valueB = sortKey === 'date' ? new Date(b.date).getTime() : b.amount;

      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });

    setFiltered(result);
  }, [receipts, showReimbursedOnly, sortKey, sortOrder]);

  const handleExportCSV = () => {
    const headers = ['日付', '取引先', '勘定科目', '金額', '立替種別', '立替者', '精算済'];
    const rows = filtered.map(
      (r) =>
        `${r.date},${r.vendor},${r.category},${r.amount},${r.reimbursement_types?.name || ''},${r.reimbursement_users?.username || ''},${r.is_reimbursed ? '済' : ''}`
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'receipts.csv';
    link.click();
  };

  const toggleSort = (key: 'date' | 'amount') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">領収書一覧</h1>
        <div className="flex gap-2">
          <Button onClick={onNavigateToScan} className="bg-blue-600 text-white flex items-center gap-1">
            <Upload className="w-4 h-4" />
            読み取り
          </Button>
          <Button onClick={onNavigateToUsers} className="bg-green-600 text-white flex items-center gap-1">
            <Users className="w-4 h-4" />
            立替者管理
          </Button>
          <Button onClick={handleExportCSV} disabled={filtered.length === 0}>
            <FileDown className="w-4 h-4" />
            CSV出力
          </Button>
          <Button onClick={onSignOut} variant="outline" className="flex items-center gap-1">
            <LogOut className="w-4 h-4" />
            ログアウト
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showReimbursedOnly}
            onChange={() => setShowReimbursedOnly(!showReimbursedOnly)}
          />
          精算済のみ表示
        </label>
        <span className="text-sm text-gray-500">
          ソート: 
          <button onClick={() => toggleSort('date')} className="ml-2 underline">
            日付 {sortKey === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button onClick={() => toggleSort('amount')} className="ml-2 underline">
            金額 {sortKey === 'amount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
          </button>
        </span>
      </div>

      {filtered.length === 0 ? (
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
                <th className="px-4 py-2 text-left">立替種別</th>
                <th className="px-4 py-2 text-left">立替者</th>
                <th className="px-4 py-2 text-center">精算済</th>
                <th className="px-4 py-2 text-center">編集</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((receipt) => (
                <tr
                  key={receipt.id}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-2">{receipt.date}</td>
                  <td className="px-4 py-2">{receipt.vendor}</td>
                  <td className="px-4 py-2">{receipt.category}</td>
                  <td className="px-4 py-2 text-right">¥{receipt.amount.toLocaleString()}</td>
                  <td className="px-4 py-2">{receipt.reimbursement_types?.name || '-'}</td>
                  <td className="px-4 py-2">{receipt.reimbursement_users?.username || '-'}</td>
                  <td className="px-4 py-2 text-center">{receipt.is_reimbursed ? '✔' : ''}</td>
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
