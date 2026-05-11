import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'; 
import api from './services/api';
import DetailPage from './DetailPage';
import HomePage from './HomePage';
import LibraryPage from './LibraryPage';
import AuthModal from './components/AuthModal';
import { useAuth } from './contexts/AuthContext';
import { useLibrary } from './contexts/LibraryContext';

// --- 1. PARÇA: KART TASARIMI (Tekrar tekrar yazmamak için) ---
const MediaCard = ({ id, title, image, subtitle, badge, badgeColor, category, isDarkMode, rating, date, voteCount, onAddLibrary, inLibrary, isLoggedIn }) => (
  <div className="relative group h-full">
    <Link to={`/detail/${category}/${id}`} className={`relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition hover:-translate-y-1 block h-full ${
      isDarkMode ? 'bg-slate-900' : 'bg-white border border-gray-200'
    }`}>
      <div className={`aspect-[2/3] w-full ${
        isDarkMode ? 'bg-slate-800' : 'bg-gray-100'
      }`}>
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
      </div>
      <div className="p-4">
        <h3 className={`font-bold text-lg truncate ${
          isDarkMode ? 'text-slate-100' : 'text-gray-900'
        }`} title={title}>{title}</h3>
        <p className={`text-sm mt-1 truncate ${
          isDarkMode ? 'text-slate-400' : 'text-gray-600'
        }`}>{subtitle}</p>
        
        {rating || date ? (
          <div className="flex items-center justify-between gap-2 mt-3">
            {rating && (
              <span className={`text-xs px-2 py-1 rounded ${badgeColor} bg-opacity-20 border border-opacity-30`} title={voteCount ? `${voteCount.toLocaleString()} değerlendirme` : ''}>
                ⭐ {rating}{voteCount ? ` (${voteCount >= 1000 ? (voteCount / 1000).toFixed(1) + 'k' : voteCount})` : ''}
              </span>
            )}
            {date && (
              <span className={`text-xs px-2 py-1 rounded ${badgeColor} bg-opacity-20 border border-opacity-30`}>
                📅 {date}
              </span>
            )}
          </div>
        ) : (
          <span className={`inline-block mt-3 text-xs px-2 py-1 rounded ${badgeColor} bg-opacity-20 border border-opacity-30`}>
            {badge}
          </span>
        )}
      </div>
    </Link>
    {/* Kütüphaneye Ekle Butonu */}
    {isLoggedIn && onAddLibrary && (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddLibrary(); }}
        className={`absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all z-10 shadow-lg ${
          inLibrary
            ? 'bg-green-500 text-white opacity-100'
            : 'bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-blue-600'
        }`}
        title={inLibrary ? 'Kütüphanede ✓' : 'Kütüphaneye Ekle'}
      >
        {inLibrary ? '✓' : '+'}
      </button>
    )}
  </div>
);

// --- 2. PARÇA: KATEGORİ SAYFASI (Menüye tıklanınca açılan yer) ---
const CategoryPage = ({ type, isDarkMode }) => {
  const { currentUser } = useAuth();
  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibrary();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);

  // Tür listesini yükle
  useEffect(() => {
    const fetchGenres = async () => {
      if (type === 'movies') {
        const movieGenres = await api.getMovieGenres();
        setGenres(movieGenres);
      } else if (type === 'series') {
        const seriesGenres = await api.getSeriesGenres();
        setGenres(seriesGenres);
      } else if (type === 'books') {
        // Kitap kategorileri (Manuel liste)
        setGenres([
          { id: 'fiction', name: 'Kurgu' },
          { id: 'science', name: 'Bilim' },
          { id: 'history', name: 'Tarih' },
          { id: 'biography', name: 'Biyografi' },
          { id: 'poetry', name: 'Şiir' },
          { id: 'drama', name: 'Drama' },
          { id: 'fantasy', name: 'Fantastik' },
          { id: 'mystery', name: 'Gizem' }
        ]);
      }
    };
    fetchGenres();
  }, [type]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setPage(1);
      setItems([]);
      let data;
      
      if (type === 'movies') {
        data = selectedGenre 
          ? await api.getMoviesByGenre(selectedGenre, 1)
          : await api.getPopularMovies(1);
        setItems(data.results);
        setHasMore(data.total_pages > 1);
      } else if (type === 'series') {
        data = selectedGenre
          ? await api.getSeriesByGenre(selectedGenre, 1)
          : await api.getPopularSeries(1);
        setItems(data.results);
        setHasMore(data.total_pages > 1);
      } else if (type === 'books') {
        data = selectedGenre
          ? await api.getBooksBySubject(selectedGenre, 0)
          : await api.getGeneralBooks(0);
        // Geçersiz kitapları filtrele
        const validBooks = data.results.filter(book => 
          book.volumeInfo && 
          book.volumeInfo.title && 
          book.volumeInfo.imageLinks?.thumbnail
        );
        setItems(validBooks);
        setHasMore(data.totalItems > 20);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [type, selectedGenre]);

  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    let data;
    
    if (type === 'movies') {
      data = selectedGenre
        ? await api.getMoviesByGenre(selectedGenre, nextPage)
        : await api.getPopularMovies(nextPage);
      setItems(prev => [...prev, ...data.results]);
      setHasMore(nextPage < data.total_pages);
    } else if (type === 'series') {
      data = selectedGenre
        ? await api.getSeriesByGenre(selectedGenre, nextPage)
        : await api.getPopularSeries(nextPage);
      setItems(prev => [...prev, ...data.results]);
      setHasMore(nextPage < data.total_pages);
    } else if (type === 'books') {
      const startIndex = page * 20;
      data = selectedGenre
        ? await api.getBooksBySubject(selectedGenre, startIndex)
        : await api.getGeneralBooks(startIndex);
      // Geçersiz kitapları filtrele
      const validBooks = data.results.filter(book => 
        book.volumeInfo && 
        book.volumeInfo.title && 
        book.volumeInfo.imageLinks?.thumbnail
      );
      setItems(prev => [...prev, ...validBooks]);
      setHasMore(startIndex + 20 < data.totalItems);
    }
    
    setPage(nextPage);
    setLoadingMore(false);
  };

  const titles = { movies: '', series: '', books: '' };

  if (loading) return <div className={`text-center p-10 animate-pulse ${
    isDarkMode ? 'text-blue-400' : 'text-blue-600'
  }`}>Yükleniyor...</div>;

  return (
    <div className="animate-fade-in">
      <h2 className={`text-2xl font-bold mb-6 border-l-4 border-blue-500 pl-4 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>{titles[type]}</h2>
      
      {/* Tür Filtreleme */}
      {genres.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedGenre(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !selectedGenre
                  ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                  : (isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              Tümü
            </button>
            {genres.map(genre => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedGenre === genre.id
                    ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                    : (isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {items.map((item) => {
          const isBook = type === 'books';
          
          // Kitaplar için volumeInfo kontrolü
          if (isBook && (!item.volumeInfo || !item.volumeInfo.title)) {
            return null;
          }
          
          const title = isBook ? item.volumeInfo.title : (item.title || item.name);
          const img = isBook ? item.volumeInfo.imageLinks?.thumbnail : (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null);
          const date = isBook ? '' : (item.release_date || item.first_air_date || 'Tarih Yok');
          const year = date ? date.split('-')[0] : 'N/A';
          const rating = !isBook && item.vote_average ? item.vote_average.toFixed(1) : null;
          const voteCount = !isBook ? item.vote_count : null;
          const subtitle = isBook ? item.volumeInfo.authors?.join(', ') || 'Yazar Bilinmiyor' : '';
          
          const cat = type === 'movies' ? 'movie' : type === 'series' ? 'series' : 'book';
          const imgFinal = img || 'https://via.placeholder.com/300x450?text=No+Image';
          return (
            <MediaCard 
              key={item.id}
              id={item.id}
              category={cat}
              title={title}
              image={imgFinal}
              subtitle={subtitle}
              badge={isBook ? 'Kitap' : null}
              rating={rating}
              date={isBook ? null : year}
              voteCount={voteCount}
              badgeColor={isBook ? 'text-yellow-300 border-yellow-300' : 'text-blue-300 border-blue-300'}
              isDarkMode={isDarkMode}
              isLoggedIn={!!currentUser}
              inLibrary={isInLibrary(cat, item.id)}
              onAddLibrary={() => {
                if (!currentUser) return;
                if (isInLibrary(cat, item.id)) {
                  removeFromLibrary(cat, item.id);
                } else {
                  addToLibrary({ category: cat, itemId: item.id, title, image: imgFinal, subtitle });
                }
              }}
            />
          );
        })}
      </div>
      
      {/* Daha Fazla Yükle Butonu */}
      {hasMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className={`px-8 py-3 rounded-lg font-bold text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              loadingMore 
                ? 'bg-gray-500' 
                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg'
            }`}
          >
            {loadingMore ? '⏳ Yükleniyor...' : '📥 Daha Fazla Yükle'}
          </button>
        </div>
      )}
    </div>
  );
};

// --- 3. PARÇA: ANA UYGULAMA ---
function App() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ movies: [], series: [], books: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const { currentUser, logout } = useAuth();
  const { addToLibrary, isInLibrary, removeFromLibrary } = useLibrary();

  const handleAddToLibrary = async (category, itemId, title, image, subtitle) => {
    if (!currentUser) { setAuthModalTab('login'); setShowAuthModal(true); return; }
    if (isInLibrary(category, itemId)) {
      await removeFromLibrary(category, itemId);
    } else {
      await addToLibrary({ category, itemId, title, image, subtitle });
    }
  };
  
  // Dropdown önizleme için
  const [previewResults, setPreviewResults] = useState({ movies: [], series: [], books: [] });
  const [showPreview, setShowPreview] = useState(false);
  
  // Dark/Light mode state (LocalStorage ile persist)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Theme değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Arama inputu değiştiğinde önizleme getir (debounce ile)
  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(async () => {
        const [movieRes, seriesRes, bookRes] = await Promise.all([
          api.searchMovies(query),
          api.searchSeries(query),
          api.searchBooks(query)
        ]);
        setPreviewResults({ 
          movies: movieRes.slice(0, 3), 
          series: seriesRes.slice(0, 3), 
          books: bookRes.slice(0, 2) 
        });
        setShowPreview(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowPreview(false);
    }
  }, [query]); 

  // Arama Fonksiyonu (Senin kodunun geliştirilmiş hali)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) {
        setIsSearching(false);
        return;
    }
    
    setShowPreview(false); // Dropdown'u kapat
    setIsSearching(true); // Arama modunu aç
    
    // Eğer detay sayfasındayız, ana sayfaya yönlendir
    if (location.pathname.startsWith('/detail/')) {
      navigate('/');
    }
    
    const [movieRes, seriesRes, bookRes] = await Promise.all([
      api.searchMovies(query),
      api.searchSeries(query),
      api.searchBooks(query)
    ]);
    setSearchResults({ movies: movieRes, series: seriesRes, books: bookRes });
  };

  // Öneri Fonksiyonu
  const handleSuggest = async () => {
    let suggestion = null;
    
    if (location.pathname === '/movies') {
      suggestion = await api.getRandomMovie();
      if (suggestion) navigate(`/detail/movie/${suggestion.id}`);
    } else if (location.pathname === '/series') {
      suggestion = await api.getRandomSeries();
      if (suggestion) navigate(`/detail/series/${suggestion.id}`);
    } else if (location.pathname === '/books') {
      suggestion = await api.getRandomBook();
      if (suggestion) navigate(`/detail/book/${suggestion.id}`);
    }
  };

  // Arama sonuçlarını gösteren özel bir bileşen (Kod temizliği için)
  const SearchResultsView = () => (
    <div className="space-y-12">
        <h2 className={`text-3xl font-bold text-center mb-8 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>🔍 "{query}" için sonuçlar</h2>
        
        {/* Filmler */}
        {searchResults.movies.length > 0 && (
            <section>
                <h3 className={`text-xl font-bold mb-4 border-b pb-2 ${
                  isDarkMode ? 'text-blue-400 border-slate-700' : 'text-blue-600 border-gray-300'
                }`}>🎬 Filmler</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {searchResults.movies.map(m => <MediaCard key={m.id} id={m.id} category="movie" title={m.title} subtitle="" image={m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null} rating={m.vote_average?.toFixed(1)} date={m.release_date?.split('-')[0]} voteCount={m.vote_count} badgeColor="text-blue-300 border-blue-300" isDarkMode={isDarkMode} />)}
                </div>
            </section>
        )}

         {/* Diziler */}
         {searchResults.series.length > 0 && (
            <section>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {searchResults.series.map(s => <MediaCard key={s.id} id={s.id} category="series" title={s.name} subtitle="" image={s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : null} rating={s.vote_average?.toFixed(1)} date={s.first_air_date?.split('-')[0]} voteCount={s.vote_count} badgeColor="text-pink-300 border-pink-300" isDarkMode={isDarkMode} />)}
                </div>
            </section>
        )}

        {/* Kitaplar */}
        {searchResults.books.length > 0 && (
            <section>
                <h3 className={`text-xl font-bold mb-4 border-b pb-2 ${
                  isDarkMode ? 'text-yellow-400 border-slate-700' : 'text-yellow-600 border-gray-300'
                }`}>📚 Kitaplar</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {searchResults.books.map(b => <MediaCard key={b.id} id={b.id} category="book" title={b.volumeInfo.title} subtitle={b.volumeInfo.authors?.join(', ') || 'Yazar Bilinmiyor'} image={b.volumeInfo.imageLinks?.thumbnail} badge="Kitap" badgeColor="text-yellow-300 border-yellow-300" isDarkMode={isDarkMode} />)}
                </div>
            </section>
        )}
        
        {/* Hiç sonuç bulunamazsa */}
        {searchResults.movies.length === 0 && searchResults.series.length === 0 && searchResults.books.length === 0 && (
            <div className={`text-center py-20 ${
              isDarkMode ? 'text-slate-400' : 'text-gray-600'
            }`}>
                <p className="text-2xl mb-2">🔍</p>
                <p className="text-lg">Hiçbir sonuç bulunamadı</p>
            </div>
        )}
    </div>
  );

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      
      {/* NAVBAR */}
      <nav className={`sticky top-0 z-50 backdrop-blur-sm border-b shadow-xl transition-colors ${
        isDarkMode ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-gray-200'
      }`}>
        <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <Link to="/" onClick={() => {setQuery(''); setIsSearching(false)}} className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:scale-105 transition">
            ChapterOne
          </Link>

          {/* Menü Linkleri */}
          <div className={`flex gap-1 p-1 rounded-lg order-3 md:order-2 ${
            isDarkMode ? 'bg-slate-900' : 'bg-gray-100'
          }`}>
            {[
              { path: '/movies', label: 'Filmler' },
              { path: '/series', label: 'Diziler' },
              { path: '/books', label: 'Kitaplar' },
              ...(currentUser ? [{ path: '/library', label: '📖 Kütüphanem' }] : [])
            ].map((link) => (
              <Link 
                key={link.path}
                to={link.path}
                onClick={() => {setQuery(''); setIsSearching(false)}}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  location.pathname === link.path && !isSearching
                    ? (isDarkMode ? 'bg-slate-800 text-white shadow' : 'bg-white text-gray-900 shadow')
                    : (isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200')
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Öner Butonu */}
            {['/movies', '/series', '/books'].includes(location.pathname) && (
              <button
                onClick={handleSuggest}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isDarkMode 
                    ? 'bg-purple-600 text-white hover:bg-purple-700 shadow' 
                    : 'bg-purple-500 text-white hover:bg-purple-600 shadow'
                }`}
              >
                🎲 {location.pathname === '/movies' ? 'Film' : location.pathname === '/series' ? 'Dizi' : 'Kitap'} Öner
              </button>
            )}
          </div>

          {/* Arama Çubuğu, Giriş/Kayıt ve Theme Toggle */}
          <div className="w-full md:w-auto flex items-center gap-2 order-2 md:order-3 relative">
            <div className="relative flex-1 md:w-64">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ara..." 
                  className={`w-full p-2 rounded-lg border focus:outline-none focus:border-blue-400 text-sm transition-colors ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => query.length >= 2 && setShowPreview(true)}
                  onBlur={() => setTimeout(() => setShowPreview(false), 200)}
                />
                <button type="submit" className="px-4 bg-blue-600 rounded-lg hover:bg-blue-700 text-white text-sm transition-colors">Ara</button>
              </form>

              {/* Dropdown Önizleme */}
              {showPreview && query.length >= 2 && (
                <div className={`absolute top-full left-0 right-12 mt-2 rounded-lg shadow-2xl border max-h-96 overflow-y-auto z-50 ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 custom-scrollbar' : 'bg-white border-gray-200 custom-scrollbar-light'
                }`}>
                  {/* Filmler */}
                  {previewResults.movies.length > 0 && (
                    <div className="p-3 border-b border-slate-700">
                      <h4 className={`text-xs font-bold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>🎬 Filmler</h4>
                      {previewResults.movies.map(m => (
                        <Link
                          key={m.id}
                          to={`/detail/movie/${m.id}`}
                          onClick={() => { setShowPreview(false); setQuery(''); }}
                          className={`flex gap-3 p-2 rounded hover:bg-opacity-50 transition ${
                            isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
                          }`}
                        >
                          <img src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : 'https://via.placeholder.com/50x75'} 
                               alt={m.title} className="w-10 h-14 object-cover rounded" />
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{m.title}</p>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>⭐ {m.vote_average} • {m.release_date?.split('-')[0]}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Diziler */}
                  {previewResults.series.length > 0 && (
                    <div className="p-3 border-b border-slate-700">
                      <h4 className={`text-xs font-bold mb-2 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>📺 Diziler</h4>
                      {previewResults.series.map(s => (
                        <Link
                          key={s.id}
                          to={`/detail/series/${s.id}`}
                          onClick={() => { setShowPreview(false); setQuery(''); }}
                          className={`flex gap-3 p-2 rounded hover:bg-opacity-50 transition ${
                            isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
                          }`}
                        >
                          <img src={s.poster_path ? `https://image.tmdb.org/t/p/w92${s.poster_path}` : 'https://via.placeholder.com/50x75'} 
                               alt={s.name} className="w-10 h-14 object-cover rounded" />
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{s.name}</p>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>⭐ {s.vote_average} • {s.first_air_date?.split('-')[0]}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Kitaplar */}
                  {previewResults.books.length > 0 && (
                    <div className="p-3">
                      <h4 className={`text-xs font-bold mb-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>📚 Kitaplar</h4>
                      {previewResults.books.map(b => (
                        <Link
                          key={b.id}
                          to={`/detail/book/${b.id}`}
                          onClick={() => { setShowPreview(false); setQuery(''); }}
                          className={`flex gap-3 p-2 rounded hover:bg-opacity-50 transition ${
                            isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
                          }`}
                        >
                          <img src={b.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/50x75'} 
                               alt={b.volumeInfo.title} className="w-10 h-14 object-cover rounded" />
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{b.volumeInfo.title}</p>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{b.volumeInfo.authors?.join(', ')}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Sonuç yoksa */}
                  {previewResults.movies.length === 0 && previewResults.series.length === 0 && previewResults.books.length === 0 && (
                    <div className={`p-4 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      Sonuç bulunamadı
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Giriş/Kayıt veya Kullanıcı Bilgisi */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  👤 {currentUser.displayName || 'Kullanıcı'}
                </span>
                <button 
                  onClick={logout}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => { setAuthModalTab('login'); setShowAuthModal(true); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Giriş
                </button>
                <button 
                  onClick={() => { setAuthModalTab('signup'); setShowAuthModal(true); }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Kayıt Ol
                </button>
              </>
            )}
            
            {/* Theme Toggle Button */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-all hover:scale-110 ${
                isDarkMode ? 'bg-slate-900 text-yellow-400 hover:bg-slate-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isDarkMode ? 'Açık Moda Geç' : 'Koyu Moda Geç'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* İÇERİK ALANI */}
      <main className="container mx-auto p-6 min-h-[80vh]">
        <Routes>
          <Route path="/" element={isSearching ? <SearchResultsView /> : <HomePage isDarkMode={isDarkMode} />} />
          <Route path="/movies" element={isSearching ? <SearchResultsView /> : <CategoryPage type="movies" isDarkMode={isDarkMode} />} />
          <Route path="/series" element={isSearching ? <SearchResultsView /> : <CategoryPage type="series" isDarkMode={isDarkMode} />} />
          <Route path="/books" element={isSearching ? <SearchResultsView /> : <CategoryPage type="books" isDarkMode={isDarkMode} />} />
          <Route path="/library" element={<LibraryPage isDarkMode={isDarkMode} />} />
          <Route path="/detail/:category/:id" element={<DetailPage isDarkMode={isDarkMode} />} />
        </Routes>
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        isDarkMode={isDarkMode}
        initialTab={authModalTab}
      />
    </div>
  );
}

export default App;