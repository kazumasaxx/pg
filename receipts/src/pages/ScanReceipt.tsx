import { FormEvent, useEffect, useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Camera, Loader2, RefreshCw, Upload, X } from 'lucide-react';
import { analyzeReceipt } from '../lib/gemini';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { CameraComponent } from '../components/ui/camera';

type Props = {
  onBack: () => void;
};

function ScanReceipt({ onBack }: Props) {
  const [scanningData, setScanningData] = useState({
    date: '',
    vendor: '',
    category: '',
    amount: '',
    reimbursement_type_id: '',
    reimbursement_user_id: '',
    is_reimbursed: false,
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [reimbursementTypes, setReimbursementTypes] = useState<any[]>([]);
  const [reimbursementUsers, setReimbursementUsers] = useState<any[]>([]);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const result = reader.result as string;
          setPreviewImage(result);

          try {
            const ocrResult = await analyzeReceipt(result);
            setScanningData({ ...scanningData, ...ocrResult });
            toast.success('領収書を解析しました');
          } catch (error) {
            toast.error('解析に失敗しました');
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        toast.error('画像の読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmitReceipt = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const amount = parseInt(scanningData.amount);
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('ユーザー取得失敗');

      const { error } = await supabase.from('receipts').insert({
        ...scanningData,
        amount,
        user_id: userId,
        reimbursement_type_id: scanningData.reimbursement_type_id || null,
        reimbursement_user_id: scanningData.reimbursement_user_id || null,
        is_reimbursed: scanningData.is_reimbursed,
      });

      if (error) throw error;

      toast.success('領収書を保存しました');
      setScanningData({
        date: '',
        vendor: '',
        category: '',
        amount: '',
        reimbursement_type_id: '',
        reimbursement_user_id: '',
        is_reimbursed: false,
      });
      setPreviewImage(null);
      setShowCamera(false);
    } catch (error) {
      toast.error('保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraCapture = async (
    imageSrc: string,
    ocrResult: { date: string; vendor: string; category: string; amount: string }
  ) => {
    setPreviewImage(imageSrc);
    setShowCamera(false);
    setScanningData({ ...scanningData, ...ocrResult });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-xl mx-auto">
      <button onClick={onBack} className="mb-4 text-blue-600 hover:underline">
        ← 戻る
      </button>
      <h1 className="text-2xl font-bold mb-6">領収書の読み取り</h1>

      <div className="bg-white p-6 rounded shadow">
        <div className="mb-6">
          {previewImage ? (
            <div className="relative">
              <img src={previewImage} alt="preview" className="rounded" />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed p-6 rounded flex flex-col items-center">
              <Upload className="w-8 h-8 text-gray-400 mb-4" />
              <div className="flex gap-4">
                <Button onClick={() => setShowCamera(true)} className="bg-blue-600 text-white">
                  <Camera className="w-4 h-4 mr-1" /> カメラで撮影
                </Button>
                <label className="cursor-pointer bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  画像をアップロード
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-500">JPG, PNG形式の画像</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitReceipt} className="space-y-4">
          <Input
            type="date"
            value={scanningData.date}
            onChange={(e) => setScanningData({ ...scanningData, date: e.target.value })}
            required
          />
          <Input
            type="text"
            placeholder="取引先"
            value={scanningData.vendor}
            onChange={(e) => setScanningData({ ...scanningData, vendor: e.target.value })}
            required
          />
          <select
            value={scanningData.category}
            onChange={(e) => setScanningData({ ...scanningData, category: e.target.value })}
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
            value={scanningData.amount}
            onChange={(e) => setScanningData({ ...scanningData, amount: e.target.value })}
            required
          />

          <select
            value={scanningData.reimbursement_type_id}
            onChange={(e) =>
              setScanningData({ ...scanningData, reimbursement_type_id: e.target.value })
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
            value={scanningData.reimbursement_user_id}
            onChange={(e) =>
              setScanningData({ ...scanningData, reimbursement_user_id: e.target.value })
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
              checked={scanningData.is_reimbursed}
              onChange={(e) =>
                setScanningData({ ...scanningData, is_reimbursed: e.target.checked })
              }
            />
            <label htmlFor="isReimbursed" className="text-sm text-gray-700">
              精算済み
            </label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1 bg-blue-600 text-white" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
            <Button
              type="button"
              onClick={() => setShowCamera(true)}
              className="bg-gray-600 text-white"
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              再撮影
            </Button>
          </div>
        </form>
      </div>

      {showCamera && (
        <CameraComponent
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

export default ScanReceipt;
