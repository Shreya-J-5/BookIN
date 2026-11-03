import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { graphqlRequest } from '../services/graphqlClient';
import { useAuth } from '../context/AuthContext';
import { BookinIconOutline } from '../components/BookinLogo';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  Film,
  Calendar,
  Ticket,
  Building2,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const { selectedCity = 'Ahmedabad' } = useAuth();
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const urlSearch = searchParams.get('search') || '';

  // Cinematic Hero Landscape Banners (Matches reference screenshot with Interstellar, Dune, etc.)
  const heroBanners = [
    {
      id: 1,
      title: "Interstellar — Re-Release",
      subtitle: `Christopher Nolan's Masterpiece Returns to Theatres in ${selectedCity || 'Ahmedabad'}`,
      imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80",
      ctaSlug: "interstellar-re-release",
      tag: "IMAX RE-RELEASE"
    },
    {
      id: 2,
      title: "Dune: Part Two",
      subtitle: `Experience The Epic Saga in IMAX 3D across ${selectedCity || 'Ahmedabad'}`,
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
      ctaSlug: "dune-part-two",
      tag: "CINEMATIC EVENT"
    },
    {
      id: 3,
      title: "Kalki 2898 AD",
      subtitle: "The Future of Indian Epic Cinema Arrives",
      imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80",
      ctaSlug: "kalki-2898-ad",
      tag: "BLOCKBUSTER"
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

  // Auto-scroll hero banner
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
    <div className="bg-[#FFFFFF] min-h-screen pb-16">
      
      {/* 1. Hero Promotional Banner (Matches reference layout: landscape, dark overlay, gold button) */}
      {!urlSearch && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
          <div className="relative w-full h-[220px] sm:h-[320px] md:h-[380px] rounded-md overflow-hidden bg-[#202020]">
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
                  className="w-full h-full object-cover object-center brightness-90"
                />
                
                {/* Left/bottom dark overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-12 text-white">
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                    {banner.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#CCCCCC] mt-1 max-w-xl">
                    {banner.subtitle}
                  </p>
                  <div className="mt-4">
                    <Link
                      to={`/movie/${banner.ctaSlug}`}
                      className="inline-flex items-center px-4 py-2 bg-[#D5A936] hover:bg-[#C2982B] text-[#1A1A1A] text-xs font-bold rounded-sm transition shadow-sm"
                    >
                      Book Tickets
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Carousel Navigation Arrows */}
            <button
              type="button"
              onClick={prevBanner}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={nextBanner}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicator Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5 items-center">
              {heroBanners.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => setActiveBannerIndex(dotIdx)}
                  className={`transition-all ${
                    dotIdx === activeBannerIndex
                      ? 'w-5 h-1.5 bg-[#D5A936] rounded-full'
                      : 'w-1.5 h-1.5 bg-white/70 rounded-full'
                  }`}
                  aria-label={`Slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Filter Bar (Directly below hero banner, matching screenshot) */}
      <div className="border-t border-b border-[#DADADA] bg-white py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          
          {/* Genre Filters (Left) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedGenre('')}
              className={`px-3 py-1 text-xs font-semibold rounded-sm transition ${
                !selectedGenre
                  ? 'bg-[#D5A936] text-[#202020]'
                  : 'bg-white text-[#666666] hover:text-[#202020] border border-[#DADADA]'
              }`}
            >
              All Genres
            </button>
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(selectedGenre === g.name ? '' : g.name)}
                className={`px-3 py-1 text-xs font-semibold rounded-sm transition ${
                  selectedGenre === g.name
                    ? 'bg-[#D5A936] text-[#202020]'
                    : 'bg-white text-[#666666] hover:text-[#202020] border border-[#DADADA]'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Language Selector (Right) */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#666666] font-medium hidden sm:inline">Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-xs bg-white border border-[#DADADA] rounded-sm px-2.5 py-1 text-[#202020] focus:outline-none focus:border-[#D5A936]"
            >
              <option value="">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        
        {/* Recommended Movies Section */}
        <div>
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#202020]">
                Recommended Movies for {selectedCity || 'Ahmedabad'}
              </h2>
              <p className="text-xs text-[#666666] mt-0.5">
                Discover the latest releases in your area.
              </p>
            </div>
            <Link
              to="/?category=movies"
              className="text-xs font-bold text-[#D5A936] hover:underline flex items-center"
            >
              See All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {/* Movies Cards Horizontal Grid */}
          {loading ? (
            <div className="py-20 text-center text-[#666666] border border-[#DADADA] rounded-sm">
              <div className="w-8 h-8 border-2 border-[#D5A936] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-medium">Fetching cinema listings...</p>
            </div>
          ) : movies.length === 0 ? (
            <div className="border border-[#DADADA] bg-white rounded-sm p-12 text-center max-w-lg mx-auto">
              <BookinIconOutline className="w-16 h-16 text-[#202020] mx-auto mb-3" />
              <h4 className="text-base font-bold text-[#202020]">Coming Soon</h4>
              <p className="text-xs text-[#666666] mt-1">Try clearing filters or switching your city.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {movies.map((movie, index) => {
                const avgRating =
                  movie.reviews?.length > 0
                    ? (movie.reviews.reduce((acc, r) => acc + r.rating, 0) / movie.reviews.length).toFixed(1)
                    : '4.0';

                return (
                  <React.Fragment key={movie.id}>
                    {/* Movie Card matching the reference screenshot */}
                    <div className="bg-white border border-[#DADADA] rounded-sm p-2.5 flex flex-col justify-between hover:border-[#D5A936] transition group">
                      
                      {/* Poster Area */}
                      <Link to={`/movie/${movie.slug}`} className="block relative aspect-[3/4] bg-[#F5F5F5] border border-[#DADADA] rounded-sm overflow-hidden mb-2.5">
                        {movie.posterUrl ? (
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            onError={(e) => {
                              // If image fails to load, fallback to graphic placeholder matching screenshot
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}

                        {/* Graphic Placeholder with BookIN Monogram (matches screenshot cross-box) */}
                        <div
                          className="w-full h-full absolute inset-0 flex flex-col items-center justify-center p-4 text-[#202020] bg-white"
                          style={{ display: movie.posterUrl ? 'none' : 'flex' }}
                        >
                          <svg className="w-full h-full absolute inset-0 pointer-events-none opacity-20" preserveAspectRatio="none">
                            <line x1="0" y1="0" x2="100%" y2="100%" stroke="#202020" strokeWidth="1" />
                            <line x1="100%" y1="0" x2="0" y2="100%" stroke="#202020" strokeWidth="1" />
                          </svg>
                          <BookinIconOutline className="w-12 h-12 text-[#202020] z-10" />
                        </div>
                      </Link>

                      {/* Movie Metadata */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link
                            to={`/movie/${movie.slug}`}
                            className="block font-bold text-xs sm:text-sm text-[#202020] truncate hover:text-[#D5A936] transition"
                            title={movie.title}
                          >
                            {movie.title}
                          </Link>

                          {/* Rating Row with Gold Star */}
                          <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-[#666666]">
                            <div className="flex items-center text-[#D5A936]">
                              <Star className="w-3.5 h-3.5 fill-[#D5A936] text-[#D5A936] mr-0.5" />
                              <span className="font-bold text-[#202020]">{avgRating}</span>
                            </div>
                            <span>•</span>
                            <span>{movie.language || 'English'}</span>
                          </div>
                        </div>

                        {/* Book Now Button (Dark Charcoal as in screenshot) */}
                        <Link
                          to={`/movie/${movie.slug}`}
                          className="mt-3 block w-full text-center py-1.5 bg-[#26343C] hover:bg-[#1D282E] text-white text-xs font-semibold rounded-sm transition"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>

                    {/* Insert Coming Soon Empty-State card after 2nd card if present, exactly as shown in reference */}
                    {index === 1 && (
                      <div className="hidden lg:flex border border-[#DADADA] bg-white rounded-sm p-4 flex-col items-center justify-center text-center">
                        <BookinIconOutline className="w-14 h-14 text-[#202020] mb-3" />
                        <h4 className="text-sm font-bold text-[#202020]">Coming Soon</h4>
                        <p className="text-[11px] text-[#666666] mt-1 max-w-[140px] leading-tight">
                          Try clearing filters or switching your city.
                        </p>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Now Showing Section */}
        {movies.length > 0 && (
          <div className="border-t border-[#DADADA] pt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#202020]">
                  Now Showing in Theatres
                </h3>
                <p className="text-xs text-[#666666] mt-0.5">
                  Catch the top critically acclaimed movies this week.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {movies.slice(0, 3).map((m) => (
                <div key={m.id} className="border border-[#DADADA] rounded-sm p-4 flex items-center space-x-3.5 bg-white hover:border-[#D5A936] transition">
                  <div className="w-16 h-20 bg-[#F5F5F5] rounded-sm overflow-hidden flex-shrink-0 border border-[#DADADA]">
                    {m.posterUrl ? (
                      <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#999999]">
                        <Film className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[#202020] truncate">{m.title}</h4>
                    <p className="text-xs text-[#666666] mt-0.5 truncate">
                      {m.genres?.map(g => g.name).join(', ') || 'Feature Film'}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-[10px] bg-[#F5F5F5] border border-[#DADADA] px-1.5 py-0.5 rounded-sm text-[#555555]">
                        {m.durationMinutes} mins
                      </span>
                      <span className="text-[10px] bg-[#FBF6EA] text-[#D5A936] border border-[#E2C36E] px-1.5 py-0.5 rounded-sm font-semibold">
                        {m.certification || 'UA'}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/movie/${m.slug}`}
                    className="px-3 py-1.5 bg-[#D5A936] hover:bg-[#C2982B] text-[#1A1A1A] font-semibold text-xs rounded-sm transition flex-shrink-0"
                  >
                    Shows
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Popular Cinemas Section */}
        <div className="border-t border-[#DADADA] pt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#202020]">
                Popular Cinemas in {selectedCity || 'Ahmedabad'}
              </h3>
              <p className="text-xs text-[#666666] mt-0.5">
                Premium multiplexes, Dolby Atmos & IMAX auditoriums.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {theatres.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-[#888888] border border-[#DADADA] rounded-sm">
                No cinemas registered in this city yet.
              </div>
            ) : (
              theatres.map((t) => (
                <div key={t.id} className="border border-[#DADADA] rounded-sm p-4 bg-white hover:border-[#D5A936] transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#202020]">{t.name}</h4>
                      <p className="text-xs text-[#666666] flex items-center mt-1">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-[#888888] flex-shrink-0" />
                        <span className="truncate">{t.address || t.city}</span>
                      </p>
                    </div>
                    <Building2 className="w-5 h-5 text-[#D5A936] flex-shrink-0" />
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#F5F5F5] flex flex-wrap gap-1.5">
                    {t.screens?.map((sc) => (
                      <span key={sc.id} className="text-[10px] px-2 py-0.5 rounded-sm bg-[#F5F5F5] text-[#555555] border border-[#DADADA]">
                        {sc.screenType}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 6. Upcoming Events Section */}
        <div className="border-t border-[#DADADA] pt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#202020]">
                Upcoming Events & Experiences
              </h3>
              <p className="text-xs text-[#666666] mt-0.5">
                Comedy shows, live concerts, and exclusive screenings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-[#DADADA] rounded-sm p-4 bg-white flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#D5A936] uppercase tracking-wider">LIVE COMEDY</span>
                <h4 className="font-bold text-sm text-[#202020] mt-1">The Standup Comedy Marathon</h4>
                <p className="text-xs text-[#666666] mt-1">Experience non-stop laughter with top touring comedians.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F5F5F5] flex items-center justify-between text-xs">
                <span className="text-[#666666]">Starting ₹499</span>
                <span className="text-[#D5A936] font-semibold cursor-pointer hover:underline">Explore</span>
              </div>
            </div>

            <div className="border border-[#DADADA] rounded-sm p-4 bg-white flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#D5A936] uppercase tracking-wider">MUSIC FESTIVAL</span>
                <h4 className="font-bold text-sm text-[#202020] mt-1">Acoustic Sunsets 2026</h4>
                <p className="text-xs text-[#666666] mt-1">An open-air evening of indie melodies and acoustic bands.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F5F5F5] flex items-center justify-between text-xs">
                <span className="text-[#666666]">Starting ₹899</span>
                <span className="text-[#D5A936] font-semibold cursor-pointer hover:underline">Explore</span>
              </div>
            </div>

            <div className="border border-[#DADADA] rounded-sm p-4 bg-white flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#D5A936] uppercase tracking-wider">PREMIERE SCREENING</span>
                <h4 className="font-bold text-sm text-[#202020] mt-1">Classic Film Society: 70mm Special</h4>
                <p className="text-xs text-[#666666] mt-1">Restored cinema prints projected in vintage auditoriums.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F5F5F5] flex items-center justify-between text-xs">
                <span className="text-[#666666]">Starting ₹350</span>
                <span className="text-[#D5A936] font-semibold cursor-pointer hover:underline">Explore</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
