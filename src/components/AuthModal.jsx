import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthModal = ({ isOpen, onClose, isDarkMode, initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form alanları
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');

  const { login, signup } = useAuth();

  if (!isOpen) return null;

  const resetForm = () => {
    setLoginEmail('');
    setLoginPassword('');
    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupPasswordConfirm('');
    setError('');
    setSuccess('');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
  };

  // Giriş işlemi
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(loginEmail, loginPassword);
      setSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-not-verified') {
        setError('Email adresiniz henüz doğrulanmamış. Lütfen e-postanızı kontrol edin.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Email veya şifre hatalı.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Şifre hatalı.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Çok fazla deneme yaptınız. Lütfen biraz bekleyin.');
      } else {
        setError('Giriş yapılırken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Kayıt işlemi
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword || !signupPasswordConfirm) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    if (signupPassword !== signupPasswordConfirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signup(signupEmail, signupPassword, signupName);
      setSuccess('Kayıt başarılı! Doğrulama e-postası gönderildi. Lütfen e-postanızı kontrol edip hesabınızı doğrulayın.');
      // Modalı kapatma — kullanıcı mesajı görsün
      setTimeout(() => {
        handleTabChange('login');
      }, 3000);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu email adresi zaten kullanılıyor.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Geçersiz email adresi.');
      } else if (err.code === 'auth/weak-password') {
        setError('Şifre çok zayıf. En az 6 karakter olmalıdır.');
      } else {
        setError('Kayıt olurken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in ${
          isDarkMode 
            ? 'bg-slate-900/95 border border-slate-700' 
            : 'bg-white/95 border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Gradient */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

        {/* Kapat Butonu */}
        <button
          onClick={() => { resetForm(); onClose(); }}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
            isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          ✕
        </button>

        {/* Logo */}
        <div className="pt-8 pb-4 text-center">
          <h2 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ChapterOne
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Film, dizi ve kitap kütüphaneni oluştur
          </p>
        </div>

        {/* Tab'lar */}
        <div className="flex mx-6 mb-6">
          <button
            onClick={() => handleTabChange('login')}
            className={`flex-1 py-3 text-sm font-bold rounded-l-lg transition-all ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : isDarkMode 
                  ? 'bg-slate-800 text-slate-400 hover:text-white' 
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => handleTabChange('signup')}
            className={`flex-1 py-3 text-sm font-bold rounded-r-lg transition-all ${
              activeTab === 'signup'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : isDarkMode 
                  ? 'bg-slate-800 text-slate-400 hover:text-white' 
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {/* Hata / Başarı Mesajı */}
        {error && (
          <div className="mx-6 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center animate-fade-in">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mx-6 mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center animate-fade-in">
            ✅ {success}
          </div>
        )}

        {/* Form */}
        <div className="px-6 pb-8">
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className={`w-full px-4 py-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Şifre
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? '⏳ Giriş yapılıyor...' : '🚀 Giriş Yap'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Kullanıcı adınız"
                  className={`w-full px-4 py-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className={`w-full px-4 py-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Şifre
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className={`w-full px-4 py-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Şifre Tekrar
                </label>
                <input
                  type="password"
                  value={signupPasswordConfirm}
                  onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                  placeholder="Şifrenizi tekrar girin"
                  className={`w-full px-4 py-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? '⏳ Kayıt yapılıyor...' : '✨ Kayıt Ol'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
