import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from './services/api';

const HomePage = ({ isDarkMode }) => {
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [books, setBooks] = useState([]);
  const [currentIndexes, setCurrentIndexes] = useState({ movies: 0, series: 0, books: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [moviesData, seriesData, booksData] = await Promise.all([
        api.getPopularMovies(1),
        api.getPopularSeries(1),
        api.getGeneralBooks(0)
      ]);
      setMovies(moviesData.results.slice(0, 10));
      setSeries(seriesData.results.slice(0, 10));
      setBooks(booksData.results.slice(0, 10));
      setLoading(false);
    };
    fetchData();
  }, []);

  // Otomatik döngü - her 3 saniyede bir değişir
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndexes(prev => ({
        movies: (prev.movies + 1) % movies.length,
        series: (prev.series + 1) % series.length,
        books: (prev.books + 1) % books.length
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [movies.length, series.length, books.length]);

  const CategoryCard = ({ title, data, type, currentIndex, icon, gradientFrom, gradientTo }) => {
    if (!data.length) return null;

    const currentItem = data[currentIndex];
    const isBook = type === 'books';
    const itemTitle = isBook ? currentItem.volumeInfo?.title : (currentItem.title || currentItem.name);
    const image = isBook 
      ? currentItem.volumeInfo?.imageLinks?.thumbnail 
      : (currentItem.poster_path ? `https://image.tmdb.org/t/p/w500${currentItem.poster_path}` : null);
    const subtitle = isBook 
      ? currentItem.volumeInfo?.authors?.join(', ') 
      : (currentItem.release_date || currentItem.first_air_date || '');

    return (
      <div className={`group relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl ${
        isDarkMode ? 'bg-slate-900' : 'bg-white border-2 border-gray-200'
      }`}>
        {/* Arka Plan Resmi */}
        <div className="relative h-[500px] overflow-hidden">
          <img 
            key={currentIndex}
            src={image || 'https://via.placeholder.com/400x600?text=No+Image'} 
            alt={itemTitle}
            className="w-full h-full object-cover animate-fade-in"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${gradientFrom} ${gradientTo}`}></div>
        </div>

        {/* İçerik */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">{icon}</span>
            <h2 className={`text-2xl font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-white'
            }`}>{title}</h2>
          </div>
          
          <h3 className="text-xl font-bold text-white drop-shadow-lg line-clamp-2">{itemTitle}</h3>
          <p className="text-sm text-gray-200 line-clamp-1">{subtitle}</p>

          {/* Progres Göstergesi */}
          <div className="flex gap-1 mt-4">
            {data.slice(0, 10).map((_, idx) => (
              <div 
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
              ></div>
            ))}
          </div>

          {/* Buton */}
          <Link 
            to={`/${type}`}
            className={`mt-4 w-full py-3 px-6 rounded-lg font-bold text-center transition-all duration-300 block
              bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white
              hover:shadow-lg hover:scale-105 transform`}
          >
            Tümünü Gör →
          </Link>
        </div>

        {/* Navigation Arrows */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            setCurrentIndexes(prev => ({
              ...prev,
              [type]: prev[type] === 0 ? data.length - 1 : prev[type] - 1
            }));
          }}
          className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
            isDarkMode ? 'bg-black/50 hover:bg-black/70' : 'bg-white/50 hover:bg-white/70'
          }`}
        >
          <span className="text-white text-xl">‹</span>
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            setCurrentIndexes(prev => ({
              ...prev,
              [type]: (prev[type] + 1) % data.length
            }));
          }}
          className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
            isDarkMode ? 'bg-black/50 hover:bg-black/70' : 'bg-white/50 hover:bg-white/70'
          }`}
        >
          <span className="text-white text-xl">›</span>
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`text-2xl font-bold animate-pulse ${
          isDarkMode ? 'text-blue-400' : 'text-blue-600'
        }`}>
          Yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Başlık */}
      <div className="text-center space-y-3 mb-12">
        <h1 className={`text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-fade-in`}>
          Keşfet
        </h1>
      </div>

      {/* 3 Kart Yan Yana */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <CategoryCard 
          title="Filmler"
          data={movies}
          type="movies"
          currentIndex={currentIndexes.movies}
          icon="🎬"
          gradientFrom="from-blue-900/80"
          gradientTo="to-transparent"
        />
        <CategoryCard 
          title="Diziler"
          data={series}
          type="series"
          currentIndex={currentIndexes.series}
          icon="📺"
          gradientFrom="from-purple-900/80"
          gradientTo="to-transparent"
        />
        <CategoryCard 
          title="Kitaplar"
          data={books}
          type="books"
          currentIndex={currentIndexes.books}
          icon="📚"
          gradientFrom="from-yellow-900/80"
          gradientTo="to-transparent"
        />
      </div>
    </div>
  );
};

export default HomePage;
