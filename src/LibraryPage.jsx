import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from './contexts/LibraryContext';
import { useAuth } from './contexts/AuthContext';

const LibraryPage = ({ isDarkMode }) => {
  const [activeTab, setActiveTab] = useState('movie');
  const { library, loading, removeFromLibrary, reorderLibrary } = useLibrary();
  const { currentUser } = useAuth();

  const tabs = [
    { key: 'movie', label: '🎬 Filmler', emptyIcon: '🎬', emptyText: 'Henüz film eklemediniz', linkTo: '/movies', linkText: 'Filmleri Keşfet' },
    { key: 'series', label: '📺 Diziler', emptyIcon: '📺', emptyText: 'Henüz dizi eklemediniz', linkTo: '/series', linkText: 'Dizileri Keşfet' },
    { key: 'book', label: '📚 Kitaplar', emptyIcon: '📚', emptyText: 'Henüz kitap eklemediniz', linkTo: '/books', linkText: 'Kitapları Keşfet' },
  ];

  const currentTab = tabs.find(t => t.key === activeTab);
  const currentItems = library[activeTab] || [];

  const handleMoveUp = (index) => {
    if (index > 0) reorderLibrary(activeTab, index, index - 1);
  };

  const handleMoveDown = (index) => {
    if (index < currentItems.length - 1) reorderLibrary(activeTab, index, index + 1);
  };

  const handleRemove = async (itemId) => {
    if (window.confirm('Bu öğeyi kütüphanenden kaldırmak istediğine emin misin?')) {
      await removeFromLibrary(activeTab, itemId);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <span className="text-6xl mb-6">🔒</span>
        <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Giriş Yapmalısınız
        </h2>
        <p className={`text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Kütüphanenizi görmek için lütfen giriş yapın.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`text-2xl font-bold animate-pulse ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          Kütüphane yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {/* Başlık */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          📖 Kütüphanem
        </h1>
        <p className={`mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          {currentUser.displayName || 'Kullanıcı'}, senin kişisel koleksiyonun
        </p>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {tabs.map(tab => (
          <div 
            key={tab.key}
            className={`text-center p-4 rounded-xl transition-all ${
              isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-gray-200 shadow-sm'
            }`}
          >
            <span className="text-2xl">{tab.emptyIcon}</span>
            <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {(library[tab.key] || []).length}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
              {tab.key === 'movie' ? 'Film' : tab.key === 'series' ? 'Dizi' : 'Kitap'}
            </p>
          </div>
        ))}
      </div>

      {/* Tab'lar */}
      <div className={`flex gap-1 p-1 rounded-xl mb-8 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : isDarkMode 
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {(library[tab.key] || []).length > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.key
                  ? 'bg-white/20'
                  : isDarkMode ? 'bg-slate-700' : 'bg-gray-300'
              }`}>
                {(library[tab.key] || []).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* İçerik */}
      {currentItems.length === 0 ? (
        /* Boş Durum */
        <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed ${
          isDarkMode ? 'border-slate-800' : 'border-gray-300'
        }`}>
          <span className="text-6xl mb-4">{currentTab.emptyIcon}</span>
          <p className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
            {currentTab.emptyText}
          </p>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
            İlgini çeken içerikleri kütüphanene ekleyerek koleksiyonunu oluştur!
          </p>
          <Link
            to={currentTab.linkTo}
            className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {currentTab.linkText} →
          </Link>
        </div>
      ) : (
        /* Liste */
        <div className="space-y-3">
          {currentItems.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all group hover:scale-[1.01] ${
                isDarkMode 
                  ? 'bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80' 
                  : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Sıra Numarası */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                index === 0 
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg shadow-yellow-500/30' 
                  : index === 1 
                    ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-400/30'
                    : index === 2 
                      ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/30'
                      : isDarkMode 
                        ? 'bg-slate-800 text-slate-300 border border-slate-700' 
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}>
                {index + 1}
              </div>

              {/* Poster */}
              <Link to={`/detail/${item.category}/${item.itemId}`} className="flex-shrink-0">
                <img 
                  src={item.image || 'https://via.placeholder.com/60x90?text=?'} 
                  alt={item.title}
                  className="w-14 h-20 object-cover rounded-lg shadow-md hover:scale-105 transition-transform"
                />
              </Link>

              {/* Bilgi */}
              <div className="flex-1 min-w-0">
                <Link to={`/detail/${item.category}/${item.itemId}`}>
                  <h3 className={`font-bold text-base truncate hover:underline ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`} title={item.title}>
                    {item.title}
                  </h3>
                </Link>
                {item.subtitle && (
                  <p className={`text-sm truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    {item.subtitle}
                  </p>
                )}
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                  {new Date(item.addedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Kontrol Butonları */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Yukarı */}
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed ${
                    isDarkMode 
                      ? 'hover:bg-slate-700 text-slate-300' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Yukarı taşı"
                >
                  ↑
                </button>
                {/* Aşağı */}
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === currentItems.length - 1}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed ${
                    isDarkMode 
                      ? 'hover:bg-slate-700 text-slate-300' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Aşağı taşı"
                >
                  ↓
                </button>
                {/* Sil */}
                <button
                  onClick={() => handleRemove(item.itemId)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    isDarkMode 
                      ? 'hover:bg-red-900/50 text-slate-400 hover:text-red-400' 
                      : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                  }`}
                  title="Kaldır"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
