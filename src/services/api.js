import axios from 'axios';

const TMDB_API_KEY = 'bf5af3bac969037a8832cf0b93704742';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const ITUNES_API_URL = 'https://itunes.apple.com/search';
const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup';

const mapItunesToBook = (book) => ({
    id: book.trackId.toString(),
    volumeInfo: {
        title: book.trackName,
        authors: [book.artistName],
        description: book.description || 'Açıklama bulunmuyor.',
        imageLinks: {
            thumbnail: book.artworkUrl100 ? book.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg') : null
        }
    }
});

const api = {
    // --- ARAMA FONKSİYONLARI (Zaten Vardı) ---
    searchMovies: async (query) => {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
                params: { api_key: TMDB_API_KEY, query: query, language: 'tr-TR' }
            });
            return response.data.results.filter(movie => 
                movie.poster_path && movie.vote_average > 5 && movie.vote_count >= 100
            );
        } catch (error) { return []; }
    },

    searchSeries: async (query) => {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
                params: { api_key: TMDB_API_KEY, query: query, language: 'tr-TR' }
            });
            return response.data.results.filter(series => 
                series.poster_path && series.vote_average > 5 && series.vote_count >= 100
            );
        } catch (error) { return []; }
    },

    searchBooks: async (query) => {
        try {
            const response = await axios.get(ITUNES_API_URL, {
                params: { term: query, entity: 'ebook', limit: 30 }
            });
            return (response.data.results || [])
                .filter(b => b.artworkUrl100 && b.description && b.artistName)
                .map(mapItunesToBook);
        } catch (error) { return []; }
    },

    // --- YENİ EKLENENLER (Menüler İçin Şart) ---
    
    // Tür Listeleri
    getMovieGenres: async () => {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
                params: { api_key: TMDB_API_KEY, language: 'tr-TR' }
            });
            return response.data.genres;
        } catch (error) { return []; }
    },

    getSeriesGenres: async () => {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/genre/tv/list`, {
                params: { api_key: TMDB_API_KEY, language: 'tr-TR' }
            });
            return response.data.genres;
        } catch (error) { return []; }
    },

    // Türe Göre Filmler
    getMoviesByGenre: async (genreId, page = 1) => {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
                params: { 
                    api_key: TMDB_API_KEY, 
                    language: 'tr-TR', 
                    page,
                    with_genres: genreId,
                    sort_by: 'popularity.desc'
                }
            });
            return {
                results: response.data.results.filter(movie => 
                    movie.poster_path && movie.vote_average > 5 && movie.vote_count >= 100
                ),
                total_pages: response.data.total_pages
            };
        } catch (error) { return { results: [], total_pages: 0 }; }
    },

    // Türe Göre Diziler
    getSeriesByGenre: async (genreId, page = 1) => {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/discover/tv`, {
                params: { 
                    api_key: TMDB_API_KEY, 
                    language: 'tr-TR', 
                    page,
                    with_genres: genreId,
                    sort_by: 'popularity.desc'
                }
            });
            return {
                results: response.data.results.filter(series => 
                    series.poster_path && series.vote_average > 5 && series.vote_count >= 100
                ),
                total_pages: response.data.total_pages
            };
        } catch (error) { return { results: [], total_pages: 0 }; }
    },

    // Kategoriye Göre Kitaplar
    getBooksBySubject: async (subject, startIndex = 0) => {
        try {
            // Hız ve filtre kalitesi için iTunes API kullanıyoruz
            const response = await axios.get(ITUNES_API_URL, {
                params: { 
                    term: subject, 
                    entity: 'ebook',
                    limit: 50, 
                    offset: startIndex
                }
            });
            // Kapak fotoğrafı, yazar, açıklama olan ve iTunes'da en az 3.5 puan ve 10 değerlendirme alan kitapları filtrele
            const results = (response.data.results || [])
                .filter(b => b.artworkUrl100 && b.artistName && b.description && b.averageUserRating >= 3.5 && b.userRatingCount >= 10)
                .slice(0, 20)
                .map(mapItunesToBook);
            
            return { results, totalItems: results.length > 0 ? 1000 : 0 };
        } catch (error) { return { results: [], totalItems: 0 }; }
    },
    
    // 1. Popüler Filmleri Getir (Sayfalama ile)
    getPopularMovies: async (page = 1) => {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
                params: { api_key: TMDB_API_KEY, language: 'tr-TR', page }
            });
            return {
                results: response.data.results.filter(movie => 
                    movie.poster_path && movie.vote_average > 5 && movie.vote_count >= 100
                ),
                total_pages: response.data.total_pages
            };
        } catch (error) { return { results: [], total_pages: 0 }; }
    },

    // 2. Popüler Dizileri Getir (Sayfalama ile)
    getPopularSeries: async (page = 1) => {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
                params: { api_key: TMDB_API_KEY, language: 'tr-TR', page }
            });
            return {
                results: response.data.results.filter(series => 
                    series.poster_path && series.vote_average > 5 && series.vote_count >= 100
                ),
                total_pages: response.data.total_pages
            };
        } catch (error) { return { results: [], total_pages: 0 }; }
    },

    // 3. Genel Kitapları Getir (Sayfalama ile) - iTunes Bestsellers
    getGeneralBooks: async (startIndex = 0) => {
        return api.getBooksBySubject('bestseller', startIndex);
    },

    // --- DETAY FONKSİYONLARI (Tek bir içerik için) ---
    getMovieDetail: async (id) => {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
            params: { api_key: TMDB_API_KEY, language: 'tr-TR', append_to_response: 'credits,videos' }
        });
        return response.data;
    },

    getSeriesDetail: async (id) => {
        const response = await axios.get(`${TMDB_BASE_URL}/tv/${id}`, {
            params: { api_key: TMDB_API_KEY, language: 'tr-TR', append_to_response: 'credits,videos' }
        });
        return response.data;
    },

    getBookDetail: async (id) => {
        try {
            const response = await axios.get(ITUNES_LOOKUP_URL, {
                params: { id: id }
            });
            if (response.data.results && response.data.results.length > 0) {
                return mapItunesToBook(response.data.results[0]);
            }
            return null;
        } catch (error) { return null; }
    },

    // --- RASTGELE ÖNERİ FONKSİYONLARI ---
    getRandomMovie: async () => {
        try {
            // Rastgele sayfa seç (1-100 arası)
            const randomPage = Math.floor(Math.random() * 100) + 1;
            const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
                params: { api_key: TMDB_API_KEY, language: 'tr-TR', page: randomPage }
            });
            // Puanı 6'dan yüksek, 1990 sonrası ve 100+ değerlendirmesi olanları filtrele
            const highRated = response.data.results.filter(m => {
                const year = m.release_date ? parseInt(m.release_date.split('-')[0]) : 0;
                return m.vote_average >= 6 && m.poster_path && year >= 1990 && m.vote_count > 100;
            });
            if (highRated.length === 0) return null;
            // Rastgele bir tane seç
            return highRated[Math.floor(Math.random() * highRated.length)];
        } catch (error) { return null; }
    },

    getRandomSeries: async () => {
        try {
            const randomPage = Math.floor(Math.random() * 100) + 1;
            const response = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
                params: { api_key: TMDB_API_KEY, language: 'tr-TR', page: randomPage }
            });
            // Puanı 6'dan yüksek, 1990 sonrası ve 100+ değerlendirmesi olanları filtrele
            const highRated = response.data.results.filter(s => {
                const year = s.first_air_date ? parseInt(s.first_air_date.split('-')[0]) : 0;
                return s.vote_average >= 6 && s.poster_path && year >= 1990 && s.vote_count > 100;
            });
            if (highRated.length === 0) return null;
            return highRated[Math.floor(Math.random() * highRated.length)];
        } catch (error) { return null; }
    },

    getRandomBook: async () => {
        try {
            const subjects = ['fiction', 'science', 'history', 'biography', 'fantasy', 'mystery', 'romance', 'thriller'];
            const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
            const randomOffset = Math.floor(Math.random() * 50);
            
            const response = await axios.get(ITUNES_API_URL, {
                params: { term: randomSubject, entity: 'ebook', limit: 50, offset: randomOffset }
            });
            
            const validWorks = (response.data.results || []).filter(b => 
                b.artworkUrl100 && b.description && b.artistName && b.averageUserRating >= 4.0 && b.userRatingCount >= 20
            );
            
            if (validWorks.length === 0) return null;
            
            const work = validWorks[Math.floor(Math.random() * validWorks.length)];
            return mapItunesToBook(work);
        } catch (error) { return null; }
    }
};

export default api;