import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './services/api';
import { useAuth } from './contexts/AuthContext';
import { useLibrary } from './contexts/LibraryContext';
import AuthModal from './components/AuthModal';

const DetailPage = ({ isDarkMode }) => {
  const { category, id } = useParams(); // URL'den parametreleri al (Örn: category="movie", id="550")
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibrary();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentCastIndex, setCurrentCastIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        let data = null;
        if (category === 'movie') data = await api.getMovieDetail(id);
        else if (category === 'series') data = await api.getSeriesDetail(id);
        else if (category === 'book') data = await api.getBookDetail(id);
        
        setDetail(data);
      } catch (error) {
        console.error("Detay çekilemedi", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [category, id]);

  if (loading) return <div className={`text-center mt-20 text-xl animate-pulse ${
    isDarkMode ? 'text-white' : 'text-gray-900'
  }`}>Detaylar yükleniyor...</div>;
  if (!detail) return <div className={`text-center mt-20 ${
    isDarkMode ? 'text-white' : 'text-gray-900'
  }`}>İçerik bulunamadı.</div>;

  // Veri tiplerine göre başlık ve resim ayıklama (Normalization)
  const isBook = category === 'book';
  const title = isBook ? detail.volumeInfo.title : (detail.title || detail.name);
  const description = isBook ? detail.volumeInfo.description : detail.overview;
  const image = isBook 
    ? detail.volumeInfo.imageLinks?.thumbnail 
    : (detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null);
  const bgImage = !isBook && detail.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${detail.backdrop_path}` 
    : null;
  
  // Film/Dizi için ekstra bilgiler
  const runtime = !isBook && (detail.runtime || detail.episode_run_time?.[0]);
  const genres = !isBook && detail.genres?.map(g => g.name).join(', ');
  const cast = !isBook && detail.credits?.cast?.slice(0, 8);
  const director = !isBook && category === 'movie' && detail.credits?.crew?.find(c => c.job === 'Director');
  
  // Fragman (Trailer) - YouTube video key
  const trailer = !isBook && detail.videos?.results?.find(
    v => v.type === 'Trailer' && v.site === 'YouTube'
  );

  return (
    <div className={`relative min-h-screen transition-colors ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      
      {/* Arka Plan Görseli (Tam Ekran) */}
      {bgImage && (
        <>
          <div 
            className="fixed inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${bgImage})` }}
          ></div>
          <div className={`fixed inset-0 ${
            isDarkMode ? 'bg-black/70' : 'bg-white/70'
          }`}></div>
        </>
      )}

      {/* İçerik Kutusu */}
      <div className="relative container mx-auto p-6 z-10">
        <button onClick={() => navigate(-1)} className={`mb-6 px-4 py-2 rounded transition-colors ${
          isDarkMode ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white hover:bg-gray-100 border border-gray-300'
        }`}>
          ← Geri Dön
        </button>

        <div className={`flex flex-col md:flex-row gap-8 p-8 rounded-2xl backdrop-blur-sm shadow-2xl ${
          isDarkMode ? 'bg-slate-950/80' : 'bg-white/90 border border-gray-200'
        }`}>
          {/* Sol: Poster */}
          <div className="w-full md:w-1/3 max-w-sm mx-auto">
            <img 
              src={image || 'https://via.placeholder.com/300x450'} 
              alt={title} 
              className={`w-full rounded-lg shadow-lg border ${
                isDarkMode ? 'border-slate-700' : 'border-gray-300'
              }`}
            />
            
            {/* Butonlar */}
            <div className="mt-4 flex flex-col gap-3">
              {/* Fragman Butonu */}
              {trailer && (
                <button
                  onClick={() => setShowTrailerModal(true)}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  ▶️ Fragmanı İzle
                </button>
              )}
              
              {/* Kütüphaneye Ekle Butonu */}
              {(() => {
                const inLib = currentUser && isInLibrary(category, id);
                const itemTitle = isBook ? detail.volumeInfo.title : (detail.title || detail.name);
                const itemImage = isBook 
                  ? detail.volumeInfo.imageLinks?.thumbnail 
                  : (detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : '');
                const itemSubtitle = isBook 
                  ? detail.volumeInfo.authors?.join(', ') || '' 
                  : (detail.release_date?.split('-')[0] || detail.first_air_date?.split('-')[0] || '');
                return (
                  <button 
                    onClick={() => {
                      if (!currentUser) { setShowAuthModal(true); return; }
                      if (inLib) { removeFromLibrary(category, id); }
                      else { addToLibrary({ category, itemId: id, title: itemTitle, image: itemImage, subtitle: itemSubtitle }); }
                    }}
                    className={`w-full py-3 rounded-lg font-bold transition shadow-lg ${
                      inLib
                        ? 'bg-green-600 hover:bg-red-600 text-white shadow-green-900/50'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/50'
                    }`}
                  >
                    {inLib ? '✓ Kütüphanemde' : 'Kütüphaneme Ekle +'}
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Sağ: Bilgiler */}
          <div className="w-full md:w-2/3 flex flex-col gap-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {title}
            </h1>
            
            <div className="flex flex-wrap gap-2 text-sm text-slate-300">
              {isBook && <span className={`px-2 py-1 rounded border ${
                isDarkMode ? 'bg-yellow-900/50 border-yellow-700' : 'bg-yellow-100 border-yellow-400 text-yellow-900'
              }`}>Yazar: {detail.volumeInfo.authors?.join(', ')}</span>}
              {!isBook && detail.release_date && <span className={`px-2 py-1 rounded border ${
                isDarkMode ? 'bg-blue-900/50 border-blue-700' : 'bg-blue-100 border-blue-400 text-blue-900'
              }`}>Yıl: {detail.release_date.split('-')[0]}</span>}
              {!isBook && detail.first_air_date && <span className={`px-2 py-1 rounded border ${
                isDarkMode ? 'bg-blue-900/50 border-blue-700' : 'bg-blue-100 border-blue-400 text-blue-900'
              }`}>Yıl: {detail.first_air_date.split('-')[0]}</span>}
              {!isBook && detail.vote_average && <span className={`px-2 py-1 rounded border ${
                isDarkMode ? 'bg-green-900/50 border-green-700' : 'bg-green-100 border-green-400 text-green-900'
              }`} title={detail.vote_count ? `${detail.vote_count.toLocaleString()} değerlendirme` : ''}>
                ⭐ {detail.vote_average.toFixed(1)} {detail.vote_count && `(${detail.vote_count >= 1000 ? (detail.vote_count / 1000).toFixed(0) + 'k' : detail.vote_count})`}
              </span>}
              {runtime && <span className={`px-2 py-1 rounded border ${
                isDarkMode ? 'bg-purple-900/50 border-purple-700' : 'bg-purple-100 border-purple-400 text-purple-900'
              }`}>⏱️ {runtime} dk</span>}
              {genres && <span className={`px-2 py-1 rounded border ${
                isDarkMode ? 'bg-pink-900/50 border-pink-700' : 'bg-pink-100 border-pink-400 text-pink-900'
              }`}>🎭 {genres}</span>}
              {director && <span className={`px-2 py-1 rounded border ${
                isDarkMode ? 'bg-indigo-900/50 border-indigo-700' : 'bg-indigo-100 border-indigo-400 text-indigo-900'
              }`}>🎬 {director.name}</span>}
            </div>

            {/* Açıklama */}
            <div>
              <p className={`text-lg leading-relaxed ${
                isDarkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>
                {description ? (
                  <>
                    {showFullDescription || description.length <= 300
                      ? description.replace(/<[^>]+>/g, '')
                      : `${description.replace(/<[^>]+>/g, '').substring(0, 300)}...`
                    }
                  </>
                ) : "Açıklama bulunmuyor."}
              </p>
              {description && description.length > 300 && (
                <button 
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className={`mt-2 text-sm font-semibold transition-colors ${
                    isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  {showFullDescription ? '▲ Daha Az Göster' : '▼ Devamını Oku'}
                </button>
              )}
            </div>

            {/* Oyuncular */}
            {cast && cast.length > 0 && (
              <div className="mt-6">
                <h2 className={`text-2xl font-bold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>🎭 Oyuncular</h2>
                <div className="relative">
                  {/* Sol Ok */}
                  {currentCastIndex > 0 && (
                    <button 
                      onClick={() => setCurrentCastIndex(prev => Math.max(0, prev - 4))}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
                        isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
                      }`}
                    >
                      ←
                    </button>
                  )}
                  
                  {/* Oyuncular */}
                  <div className="grid grid-cols-4 gap-4 px-12">
                    {cast.slice(currentCastIndex, currentCastIndex + 4).map(actor => (
                      <div key={actor.id} className={`text-center group cursor-pointer rounded-lg p-3 transition-all ${
                        isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
                      }`}>
                        <img 
                          src={actor.profile_path 
                            ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` 
                            : 'https://via.placeholder.com/185x278?text=No+Image'
                          } 
                          alt={actor.name}
                          className="w-full aspect-[2/3] object-cover rounded-lg shadow-md mb-2 group-hover:scale-105 transition-transform"
                        />
                        <p className={`font-semibold text-sm truncate ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`} title={actor.name}>{actor.name}</p>
                        <p className={`text-xs truncate ${
                          isDarkMode ? 'text-slate-400' : 'text-gray-600'
                        }`} title={actor.character}>{actor.character}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Sağ Ok */}
                  {currentCastIndex + 4 < cast.length && (
                    <button 
                      onClick={() => setCurrentCastIndex(prev => Math.min(cast.length - 4, prev + 4))}
                      className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
                        isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
                      }`}
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fragman Modal */}
      {showTrailerModal && trailer && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowTrailerModal(false)}
        >
          <div 
            className="relative w-full max-w-4xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTrailerModal(false)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-red-500 transition"
            >
              ✕ Kapat
            </button>
            <iframe
              className="w-full h-full rounded-lg shadow-2xl"
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              title="Fragman"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        isDarkMode={isDarkMode}
        initialTab="login"
      />
    </div>
  );
};

export default DetailPage;