import { FormEvent, useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Camera, Loader2, RefreshCw, Upload, X } from 'lucide-react';
import { analyzeReceipt } from '../lib/gemini';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { CameraComponent } from '../components/ui/camera';

type Props = {
  onBackToList: () => void;
};

function ScanReceipt({ onBackToList }: Props) {
  const [scanningData, setScanningData] = useState({
    date: '',
    vendor: '',
    category: '',
    amount: '',
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
            console.error(error);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        toast.error('画像の読み込みに失敗しました');
        console.error(error);
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

      if (!userId) throw new Error('ユーザー情報が取得できません');

      const { error } = await supabase.from('receipts').insert({
        date: scanningData.date,
        vendor: scanningData.vendor,
        category: scanningData.category,
        amount: amount,
        user_id: userId,
      });

      if (error) throw error;

      toast.success('領収書を保存しました');
      setScanningData({ date: '', vendor: '', category: '', amount: '' });
      setPreviewImage(null);
      setShowCamera(false);
    } catch (error) {
      toast.error('保存に失敗しました');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraCapture = async (imageSrc: string, ocrResult: {
    date: string;
    vendor: string;
    category: string;
    amount: string;
  }) => {
    setPreviewImage(imageSrc);
    setShowCamera(false);
    setScanningData({ ...scanningData, ...ocrResult });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-xl mx-auto">
      <button
        onClick={onBackToList}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← 戻る
      </button>
      <h1 className="text-2xl font-bold mb-6">領収書の読み取り</h1>

      <div className="bg-white p-6 rounded shadow">
        <div className="mb-6">
          {previewImage ? (
            <div className="relative">
              <img
                src={previewImage}
                alt="preview"
                className="rounded"
              />
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
          <Input
            type="text"
            placeholder="勘定科目"
            value={scanningData.category}
            onChange={(e) => setScanningData({ ...scanningData, category: e.target.value })}
            required
          />
          <Input
            type="number"
            placeholder="金額"
            value={scanningData.amount}
            onChange={(e) => setScanningData({ ...scanningData, amount: e.target.value })}
            required
          />

          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 text-white"
              disabled={isLoading}
            >
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
