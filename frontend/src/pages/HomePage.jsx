import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { graphqlRequest } from '../services/graphqlClient';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  ThumbsUp,
  MapPin,
  Film,
  Calendar,
  Sparkles,
  Ticket
} from 'lucide-react';

export default function HomePage() {
  const { selectedCity } = useAuth();
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const urlSearch = searchParams.get('search') || '';

  // Promotional Hero Banners (High quality BookMyShow style landscape banners)
  const heroBanners = [
    {
      id: 1,
      title: "Dune: Part Two",
      subtitle: "Experience The Epic In IMAX 3D",
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
      ctaSlug: "dune-part-two",
      badge: "IMAX EXCLUSIVE"
    },
    {
      id: 2,
      title: "Kalki 2898 AD",
      subtitle: "The Future of Indian Cinema Arrives",
      imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80",
      ctaSlug: "kalki-2898-ad",
      badge: "MEGA BLOCKBUSTER"
    },
    {
      id: 3,
      title: "Interstellar — Re-Release",
      subtitle: "Christopher Nolan's Masterpiece Returns to Theatres",
      imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80",
      ctaSlug: "interstellar-re-release",
      badge: "LIMITED ENGAGEMENT"
    }
  ];

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
                name
                screenType
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

  // Auto-scroll hero banner every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  const nextBanner = () => {
    setActiveBannerIndex((prev) => (prev + 1) % heroBanners.length);
  };

  const prevBanner = () => {
    setActiveBannerIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
  };

  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-16">
      
      {/* 1. Large Hero Promotional Carousel (BookMyShow Landscape Banners) */}
      {!urlSearch && !selectedGenre && (
        <div className="bg-[#EBEBEB] py-3 sm:py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative w-full h-[220px] sm:h-[320px] md:h-[360px] rounded-lg overflow-hidden shadow-sm group bg-[#222222]">
              {/* Slides */}
              {heroBanners.map((banner, idx) => (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    idx === activeBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover object-center filter brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
                    <span className="inline-block px-2.5 py-0.5 bg-[#F84464] text-white text-[10px] font-bold rounded uppercase tracking-wider mb-2 w-max">
                      {banner.badge}
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                      {banner.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#DDDDDD] mt-1 max-w-xl">
                      {banner.subtitle}
                    </p>
                    <div className="mt-4">
                      <Link
                        to={`/movie/${banner.ctaSlug}`}
                        className="inline-flex items-center px-5 py-2 bg-[#F84464] hover:bg-[#E03756] text-white text-xs font-bold rounded transition shadow-sm"
                      >
                        Book Tickets
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Prev / Next Arrows */}
              <button
                type="button"
                onClick={prevBanner}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Previous Banner"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={nextBanner}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition"
                aria-label="Next Banner"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dot Indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5">
                {heroBanners.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => setActiveBannerIndex(dotIdx)}
                    className={`h-1.5 rounded-full transition-all ${
                      dotIdx === activeBannerIndex ? 'w-6 bg-[#F84464]' : 'w-2 bg-white/60'
                    }`}
                    aria-label={`Go to slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        
        {/* Genre / Language Compact Filter Bar */}
        <div className="bg-white border border-[#E5E5E5] rounded-md p-3 flex flex-wrap items-center justify-between gap-3 shadow-bms">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedGenre('')}
              className={`px-3 py-1 text-xs font-medium rounded transition ${
                !selectedGenre ? 'bg-[#F84464] text-white' : 'bg-white text-[#555555] hover:bg-[#F5F5F5] border border-[#E5E5E5]'
              }`}
            >
              All Genres
            </button>
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(selectedGenre === g.name ? '' : g.name)}
                className={`px-3 py-1 text-xs font-medium rounded transition ${
                  selectedGenre === g.name ? 'bg-[#F84464] text-white' : 'bg-white text-[#555555] hover:bg-[#F5F5F5] border border-[#E5E5E5]'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#777777] font-medium hidden sm:inline">Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-xs bg-white border border-[#E5E5E5] rounded px-2.5 py-1 text-[#333333] focus:outline-none focus:border-[#F84464]"
            >
              <option value="">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
        </div>

        {/* 3. Recommended Movies Section (Crucial Section) */}
        <div>
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#222222]">
                Recommended Movies
              </h2>
              <p className="text-xs text-[#666666] mt-0.5">
                Blockbuster hits currently screening in <span className="font-semibold text-[#222222]">{selectedCity}</span>
              </p>
            </div>
            <Link
              to="/?category=movies"
              className="text-xs font-semibold text-[#F84464] hover:underline flex items-center"
            >
              See All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {/* Movies Row / Grid */}
          {loading ? (
            <div className="py-20 text-center text-[#888888] bg-white border border-[#E5E5E5] rounded-lg">
              <div className="w-8 h-8 border-2 border-[#F84464] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-medium">Fetching cinema listings...</p>
            </div>
          ) : movies.length === 0 ? (
            <div className="py-16 text-center bg-white border border-[#E5E5E5] rounded-lg p-6">
              <Film className="w-10 h-10 text-[#CCCCCC] mx-auto mb-2" />
              <h4 className="font-bold text-[#222222] text-sm">No Movies Found</h4>
              <p className="text-xs text-[#777777] mt-1">Try clearing filters or switching your city.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5 sm:gap-6">
              {movies.map((movie) => {
                const avgRating =
                  movie.reviews?.length > 0
                    ? (movie.reviews.reduce((acc, r) => acc + r.rating, 0) / movie.reviews.length).toFixed(1)
                    : '8.8';

                return (
                  <Link
                    key={movie.id}
                    to={`/movie/${movie.slug}`}
                    className="group flex flex-col bg-white border border-[#E5E5E5] rounded-lg overflow-hidden hover:shadow-bms-card transition-all"
                  >
                    {/* Poster with BookMyShow Style Aspect Ratio */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#EEEEEE]">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                        loading="lazy"
                      />

                      {/* Rating Overlay Bar at Bottom of Poster */}
                      <div className="absolute bottom-0 inset-x-0 bg-black/80 px-2.5 py-1.5 flex items-center justify-between text-white text-[11px] font-medium backdrop-blur-xs">
                        <span className="flex items-center space-x-1 text-white font-bold">
                          <Star className="w-3.5 h-3.5 text-[#F84464] fill-[#F84464]" />
                          <span>{avgRating}/10</span>
                          <span className="text-[10px] text-[#BBBBBB] font-normal ml-1">
                            ({Math.floor(Math.random() * 40 + 20)}K Votes)
                          </span>
                        </span>
                        <span className="text-[10px] bg-white/20 px-1 rounded text-white font-semibold">
                          {movie.certification}
                        </span>
                      </div>
                    </div>

                    {/* Movie Info */}
                    <div className="p-3 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className="font-bold text-[#222222] text-sm sm:text-base leading-snug group-hover:text-[#F84464] transition truncate">
                          {movie.title}
                        </h3>
                        <p className="text-xs text-[#777777] mt-1 truncate">
                          {movie.certification} • {movie.language}
                        </p>
                        <p className="text-[11px] text-[#888888] truncate mt-0.5">
                          {movie.genres?.map((g) => g.name).join(', ') || 'Action, Drama'}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#F0F0F0] flex items-center justify-between text-xs">
                        <span className="text-[#888888] text-[11px]">{movie.durationMinutes} mins</span>
                        <span className="text-[#F84464] font-semibold text-xs group-hover:underline">
                          Book Tickets
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Stream Banner Strip (BookMyShow "The Best of Live Events" / "Stream" style) */}
        <div className="bg-[#2B3148] rounded-lg p-5 sm:p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-bms">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded bg-[#F84464] flex items-center justify-center font-bold text-lg text-white">
              ▶
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#F84464]">
                BookIN Stream
              </span>
              <h3 className="text-base sm:text-lg font-bold">
                Endless Entertainment Anytime. Anywhere.
              </h3>
              <p className="text-xs text-[#AAAAAA] mt-0.5">
                Rent or buy the latest blockbuster releases directly from home.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="px-5 py-2 bg-[#F84464] hover:bg-[#E03756] text-white text-xs font-bold rounded transition whitespace-nowrap shadow-sm"
          >
            Explore Stream
          </button>
        </div>

        {/* 5. Popular Theatres / Cinemas in [City] */}
        {theatres.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#222222]">
                  Cinemas in {selectedCity}
                </h2>
                <p className="text-xs text-[#666666] mt-0.5">
                  Top multiplexes featuring IMAX, Dolby Atmos, and 4DX
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {theatres.map((t) => (
                <div
                  key={t.id}
                  className="bg-white border border-[#E5E5E5] rounded-lg p-4 hover:shadow-bms-card transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-[#222222] text-sm">{t.name}</h4>
                      <p className="text-xs text-[#666666] mt-1 line-clamp-1">{t.address}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#F0F0F0]">
                    {t.screens?.map((sc) => (
                      <span
                        key={sc.id || sc.name}
                        className="px-2 py-0.5 rounded bg-[#F5F5F5] border border-[#E5E5E5] text-[10px] text-[#555555] font-medium"
                      >
                        {sc.screenType}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
