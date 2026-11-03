import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { graphqlRequest } from '../services/graphqlClient';
import { useAuth } from '../context/AuthContext';
import { Film, Star, Clock, Calendar, Sparkles, ChevronRight, Play } from 'lucide-react';

export default function HomePage() {
  const { selectedCity } = useAuth();
  const [searchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [loading, setLoading] = useState(true);

  const urlSearch = searchParams.get('search') || '';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const query = `
          query GetHomeData($city: String, $genre: String, $language: String, $search: String) {
            movies(city: $city, genre: $genre, language: $language, search: $search) {
              id
              title
              slug
              description
              language
              durationMinutes
              releaseDate
              posterUrl
              bannerUrl
              certification
              genres {
                name
              }
            }
            genres {
              id
              name
            }
          }
        `;
        const variables = {
          city: selectedCity,
          genre: selectedGenre || null,
          language: selectedLanguage || null,
          search: urlSearch || null,
        };
        const data = await graphqlRequest(query, variables);
        setMovies(data.movies || []);
        if (data.genres) setGenres(data.genres);
      } catch (err) {
        console.error('Error fetching movies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedCity, selectedGenre, selectedLanguage, urlSearch]);

  const featuredMovie = movies[0];

  return (
    <div className="min-h-screen pb-20">
      {/* Featured Banner Hero */}
      {featuredMovie && !urlSearch && !selectedGenre && (
        <div className="relative w-full h-[420px] sm:h-[500px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e14] via-[#0c0e14]/70 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14] via-transparent to-transparent z-10" />
          <img
            src={featuredMovie.bannerUrl || featuredMovie.posterUrl}
            alt={featuredMovie.title}
            className="w-full h-full object-cover object-center filter brightness-75 scale-105 transform hover:scale-100 transition duration-700"
          />

          <div className="absolute inset-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16">
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600/90 text-white text-[11px] font-bold uppercase tracking-wider">
                  Featured Premiere
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-xs font-semibold backdrop-blur-md">
                  {featuredMovie.certification}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {featuredMovie.language}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg">
                {featuredMovie.title}
              </h1>

              <p className="text-sm text-slate-300 line-clamp-2 max-w-xl font-normal leading-relaxed">
                {featuredMovie.description}
              </p>

              <div className="flex items-center space-x-4 pt-2">
                <Link
                  to={`/movie/${featuredMovie.slug}`}
                  className="px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-rose-900/40 flex items-center space-x-2"
                >
                  <Film className="w-4 h-4" />
                  <span>Book Tickets</span>
                </Link>

                <Link
                  to={`/movie/${featuredMovie.slug}`}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm backdrop-blur-md transition flex items-center space-x-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>View Details</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Filters Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#242938]">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <span>Now Showing in</span>
              <span className="text-rose-500 underline decoration-rose-500/40 underline-offset-4">
                {selectedCity}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Explore current blockbuster screenings and reserve seats live</p>
          </div>

          {/* Genre and Language Filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedGenre('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                !selectedGenre
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                  : 'bg-[#161922] text-slate-400 hover:text-white border border-[#242938]'
              }`}
            >
              All Genres
            </button>
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g.name === selectedGenre ? '' : g.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedGenre === g.name
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'bg-[#161922] text-slate-400 hover:text-white border border-[#242938]'
                }`}
              >
                {g.name}
              </button>
            ))}

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-1.5 bg-[#161922] border border-[#242938] rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:border-rose-500"
            >
              <option value="">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="py-24 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm font-medium">Fetching cinema showtimes...</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="py-20 text-center bg-[#161922] border border-[#242938] rounded-2xl p-8 mt-6">
            <Film className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Movies Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try selecting a different genre, language, or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6 pt-8">
            {movies.map((movie) => (
              <Link
                key={movie.id}
                to={`/movie/${movie.slug}`}
                className="group flex flex-col bg-[#161922] border border-[#242938] rounded-2xl overflow-hidden hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-950/20 transition-all duration-300"
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-bold tracking-wider">
                      {movie.certification}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-slate-300 text-[10px] font-medium flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-rose-500" />
                      <span>{movie.durationMinutes}m</span>
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight group-hover:text-rose-500 transition line-clamp-1">
                      {movie.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {movie.genres?.map((g) => g.name).join(' • ') || movie.language}
                    </p>
                  </div>

                  <div className="pt-4 mt-2 border-t border-[#242938]/60 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">{movie.language}</span>
                    <span className="text-xs font-bold text-rose-500 group-hover:translate-x-0.5 transition flex items-center">
                      Book Now <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
