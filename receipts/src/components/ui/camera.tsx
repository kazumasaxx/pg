import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, X, SwitchCamera } from 'lucide-react';
import { Button } from './button';
import { analyzeReceipt } from '@/lib/gemini';
import toast from 'react-hot-toast';

interface CameraProps {
  onCapture: (imageSrc: string, ocrResult: {
    date: string;
    vendor: string;
    category: string;
    amount: string;
  }) => void;
  onClose: () => void;
}

export function CameraComponent({ onCapture, onClose }: CameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSwitchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    // Force a reconnection to the camera
    if (webcamRef.current) {
      const video = webcamRef.current.video;
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
    setIsCameraReady(false);
  }, []);

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setIsProcessing(true);
      try {
        const result = await analyzeReceipt(imageSrc);
        onCapture(imageSrc, result);
      } catch (error) {
        toast.error('領収書の解析に失敗しました');
        console.error('OCR error:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [onCapture]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">領収書を撮影</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            onUserMedia={() => setIsCameraReady(true)}
            videoConstraints={{
              facingMode: facingMode,
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }}
            className="w-full rounded-lg"
          />
          {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <p className="text-gray-500">カメラを起動中...</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-center gap-4">
          <Button
            onClick={capture}
            disabled={!isCameraReady || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {isProcessing ? '解析中...' : '撮影'}
          </Button>
          
          <Button
            onClick={handleSwitchCamera}
            className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
            disabled={!isCameraReady || isProcessing}
          >
            <SwitchCamera className="w-4 h-4" />
            {facingMode === 'user' ? '背面カメラ' : '前面カメラ'}
          </Button>
        </div>
      </div>
    </div>
  );
}