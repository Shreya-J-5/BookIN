import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { graphqlRequest } from '../services/graphqlClient';
import { useAuth } from '../context/AuthContext';
import {
  ChevronRight,
  Star,
  MapPin,
  Film,
  Calendar,
  Ticket,
  Building2,
  Sparkles,
  Search,
  SlidersHorizontal
} from 'lucide-react';

export default function HomePage() {
  const { selectedCity = 'Ahmedabad' } = useAuth();
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [loading, setLoading] = useState(true);

  const urlSearch = searchParams.get('search') || '';

  useEffect(() => {
    async function loadHomeContent() {
      setLoading(true);
      try {
        const query = `
          query GetHomeContent($city: String, $genre: String, $language: String, $search: String) {
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
              reviews {
                rating
              }
            }
            genres {
              id
              name
            }
            theatres(city: $city) {
              id
              name
              city
              address
              screens {
                id
                name
                screenType
                totalSeats
              }
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
        if (data.theatres) setTheatres(data.theatres);
      } catch (err) {
        console.error('Error loading homepage:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeContent();
  }, [selectedCity, selectedGenre, selectedLanguage, urlSearch]);

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-20">
      
      {/* 1. Large Cinematic Hero Banner (Exact match to reference screenshot) */}
      {!urlSearch && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
          <div className="relative w-full h-[360px] sm:h-[460px] md:h-[500px] rounded-2xl overflow-hidden shadow-card bg-[#0D1117] border border-[#2B323C]">
            
            {/* Cinematic Multi-Genre Imagery Collage (Sci-Fi, Fantasy Orb, Drama Portrait) */}
            <div className="absolute inset-0 flex">
              {/* Left Column: Sci-Fi Cosmic Ships */}
              <div className="w-1/3 h-full relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80"
                  alt="Sci-Fi"
                  className="w-full h-full object-cover filter brightness-[0.7] contrast-125 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0D1117]/40 to-[#0D1117]" />
              </div>

              {/* Center Column: Mystical Fantasy Orb & Cosmic Nebula */}
              <div className="w-1/3 h-full relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80"
                  alt="Fantasy"
                  className="w-full h-full object-cover filter brightness-[0.75] contrast-110"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
              </div>

              {/* Right Column: Dramatic Cinematic Portrait */}
              <div className="w-1/3 h-full relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80"
                  alt="Drama"
                  className="w-full h-full object-cover filter brightness-[0.65] contrast-115"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#0D1117]/40 to-[#0D1117]" />
              </div>
            </div>

            {/* Seamless Dark Vignette Overlay for Crisp Typography Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/60 pointer-events-none" />

            {/* Centered Bold Typography (Exact headline from reference) */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-8 max-w-3xl mx-auto text-white">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] uppercase drop-shadow-md">
                YOUR MOVIE<br />
                EXPERIENCE,<br />
                REIMAGINED.
              </h1>
              
              <p className="text-xs sm:text-sm md:text-base text-white/80 mt-4 max-w-xl font-normal leading-relaxed drop-shadow-sm">
                Book your favorite movies, choose your premium seats, and experience the magic of cinema in <span className="text-[#E5B642] font-semibold">{selectedCity}</span>.
              </p>

              {/* Quick Action Button */}
              <div className="mt-6 flex items-center space-x-3">
                <a
                  href="#movie-discovery-section"
                  className="px-6 py-2.5 bg-[#E5B642] hover:bg-[#D4A333] text-[#1E232A] font-bold text-xs sm:text-sm rounded-full transition shadow-md flex items-center space-x-1.5"
                >
                  <span>Explore Now</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. Main Content Container */}
      <div id="movie-discovery-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        
        {/* Filter Section */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
          {/* Genre Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#64748B] font-semibold flex items-center mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-[#E5B642]" />
              Genres:
            </span>
            <button
              onClick={() => setSelectedGenre('')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition ${
                !selectedGenre
                  ? 'bg-[#E5B642] text-[#1E232A] shadow-sm'
                  : 'bg-[#F8F9FA] text-[#64748B] hover:text-[#1E232A] hover:bg-[#EDF2F7]'
              }`}
            >
              All Genres
            </button>
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(selectedGenre === g.name ? '' : g.name)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition ${
                  selectedGenre === g.name
                    ? 'bg-[#E5B642] text-[#1E232A] shadow-sm'
                    : 'bg-[#F8F9FA] text-[#64748B] hover:text-[#1E232A] hover:bg-[#EDF2F7]'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#64748B] font-semibold">Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-xs bg-[#F8F9FA] border border-[#E2E8F0] rounded-md px-3 py-1.5 text-[#1E232A] focus:outline-none focus:border-[#E5B642]"
            >
              <option value="">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
        </div>

        {/* 3. Recommended Movies Section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1E232A]">
                Recommended Movies in {selectedCity}
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Blockbuster titles currently screening across leading theatres.
              </p>
            </div>
            <Link
              to="/?category=movies"
              className="text-xs font-bold text-[#E5B642] hover:text-[#D4A333] flex items-center"
            >
              See All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-20 text-center text-[#64748B] bg-white border border-[#E2E8F0] rounded-xl">
              <div className="w-8 h-8 border-2 border-[#E5B642] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-medium">Fetching cinema listings...</p>
            </div>
          ) : movies.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center max-w-md mx-auto">
              <Film className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
              <h4 className="text-base font-bold text-[#1E232A]">No Movies Found</h4>
              <p className="text-xs text-[#64748B] mt-1">Try resetting filters or exploring another city.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {movies.map((movie) => {
                const avgRating =
                  movie.reviews?.length > 0
                    ? (movie.reviews.reduce((acc, r) => acc + r.rating, 0) / movie.reviews.length).toFixed(1)
                    : '4.5';

                return (
                  <div
                    key={movie.id}
                    className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden hover:shadow-card hover:border-[#E5B642] transition-all flex flex-col justify-between group"
                  >
                    {/* Movie Poster */}
                    <Link to={`/movie/${movie.slug}`} className="block relative aspect-[2/3] overflow-hidden bg-[#1E232A]">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-xs text-[#E5B642] px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center shadow-xs">
                        <Star className="w-3 h-3 fill-[#E5B642] mr-1" />
                        <span>{avgRating}</span>
                      </div>
                    </Link>

                    {/* Movie Details */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <Link
                          to={`/movie/${movie.slug}`}
                          className="font-bold text-sm text-[#1E232A] group-hover:text-[#E5B642] transition line-clamp-1"
                          title={movie.title}
                        >
                          {movie.title}
                        </Link>
                        <p className="text-[11px] text-[#64748B] mt-1 line-clamp-1">
                          {movie.genres?.map(g => g.name).join(', ') || movie.language}
                        </p>
                      </div>

                      {/* Gold Book Now Button */}
                      <Link
                        to={`/movie/${movie.slug}`}
                        className="mt-3 block w-full text-center py-2 bg-[#E5B642] hover:bg-[#D4A333] text-[#1E232A] text-xs font-bold rounded-lg transition shadow-xs"
                      >
                        Book Tickets
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Popular Cinemas Section */}
        <div className="pt-4 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-black text-[#1E232A]">
                Popular Cinemas in {selectedCity}
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Dolby Atmos, IMAX, and Luxury Cinema experiences.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {theatres.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-[#64748B] bg-white border border-[#E2E8F0] rounded-xl">
                No cinemas registered in this city yet.
              </div>
            ) : (
              theatres.map((t) => (
                <div key={t.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#E5B642] transition shadow-subtle">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#1E232A]">{t.name}</h4>
                      <p className="text-xs text-[#64748B] flex items-center mt-1">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-[#94A3B8] flex-shrink-0" />
                        <span className="truncate">{t.address || t.city}</span>
                      </p>
                    </div>
                    <Building2 className="w-5 h-5 text-[#E5B642] flex-shrink-0" />
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#F8F9FA] flex flex-wrap gap-1.5">
                    {t.screens?.map((sc) => (
                      <span key={sc.id} className="text-[10px] px-2 py-0.5 rounded bg-[#F8F9FA] text-[#64748B] font-medium border border-[#E2E8F0]">
                        {sc.screenType}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
