import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Receipt } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import toast from 'react-hot-toast';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('アカウントを作成しました。ログインしてください。');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('ログインに成功しました');
      }
    } catch (error) {
      toast.error(isSignUp ? 'アカウント作成に失敗しました' : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <div className="flex justify-center mb-6">
          <Receipt className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-center text-gray-800 mb-4">
          {isSignUp ? '新規登録' : 'ログイン'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isSignUp ? '登録中...' : 'ログイン中...'}
              </>
            ) : isSignUp ? 'アカウント作成' : 'ログイン'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-600 hover:underline"
          >
            {isSignUp ? 'ログインに切り替え' : 'アカウントを作成'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
