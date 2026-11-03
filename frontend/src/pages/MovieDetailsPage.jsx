import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { graphqlRequest } from '../services/graphqlClient';
import { useAuth } from '../context/AuthContext';
import {
  Star,
  Clock,
  Calendar,
  MapPin,
  ChevronRight,
  Heart,
  Share2,
  Info,
  CheckCircle2,
  Play
} from 'lucide-react';

export default function MovieDetailsPage() {
  const { slug } = useParams();
  const { selectedCity, user, isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Review state
  const [userRating, setUserRating] = useState(9);
  const [userComment, setUserComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Generate 4 consecutive dates: Today, Tomorrow, Day 3, Day 4
  const dateOptions = [0, 1, 2, 3].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      offset,
      dayShort: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dateNum: d.getDate(),
      monthShort: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      isoDate: d.toISOString().split('T')[0]
    };
  });

  useEffect(() => {
    async function loadMovieDetails() {
      setLoading(true);
      try {
        const query = `
          query GetMovieDetails($slug: String!, $city: String) {
            movie(slug: $slug) {
              id
              title
              slug
              description
              language
              durationMinutes
              releaseDate
              posterUrl
              bannerUrl
              trailerUrl
              certification
              genres {
                name
              }
              reviews {
                id
                userName
                rating
                comment
                createdAt
              }
            }
          }
        `;
        const data = await graphqlRequest(query, { slug, city: selectedCity });
        setMovie(data.movie);

        if (data.movie) {
          const showsQuery = `
            query GetMovieShows($movieId: UUID!, $city: String!) {
              shows(movieId: $movieId, city: $city) {
                id
                startTime
                endTime
                basePrices
                screen {
                  id
                  name
                  screenType
                  theatre {
                    id
                    name
                    address
                    city
                  }
                }
              }
            }
          `;
          const showsData = await graphqlRequest(showsQuery, { movieId: data.movie.id, city: selectedCity });
          setShows(showsData.shows || []);
        }
      } catch (err) {
        console.error('Error fetching movie details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMovieDetails();
  }, [slug, selectedCity]);

  // Group shows by Theatre
  const groupedTheatres = {};
  shows.forEach((show) => {
    const theatre = show.screen?.theatre;
    if (!theatre) return;
    const tId = theatre.id;
    if (!groupedTheatres[tId]) {
      groupedTheatres[tId] = {
        theatre,
        shows: []
      };
    }
    groupedTheatres[tId].shows.push(show);
  });

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setReviewSubmitting(true);
    try {
      const mutation = `
        mutation AddReview($input: AddReviewInput!) {
          addReview(input: $input) {
            id
            userName
            rating
            comment
            createdAt
          }
        }
      `;
      const res = await graphqlRequest(mutation, {
        input: {
          movieId: movie.id,
          rating: parseInt(userRating, 10),
          comment: userComment
        }
      });
      setMovie((prev) => ({
        ...prev,
        reviews: [res.addReview, ...prev.reviews]
      }));
      setUserComment('');
      setShowReviewModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const scrollToBookings = () => {
    const section = document.getElementById('showtimes-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-32 text-center text-[#888888] bg-[#F5F5F5]">
        <div className="w-8 h-8 border-2 border-[#F84464] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium">Loading movie details & showtimes...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen py-32 text-center text-[#222222] bg-[#F5F5F5]">
        <h2 className="text-xl font-bold">Movie Not Found</h2>
        <Link to="/" className="text-[#F84464] text-xs font-semibold underline mt-2 inline-block">
          Return to Movies
        </Link>
      </div>
    );
  }

  const avgRating =
    movie.reviews?.length > 0
      ? (movie.reviews.reduce((acc, r) => acc + r.rating, 0) / movie.reviews.length).toFixed(1)
      : '8.8';

  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-20">
      
      {/* 1. BookMyShow Hero Banner (Dark Slate Backdrop with Left Poster + Details) */}
      <div className="bg-[#1F2533] text-white py-8 sm:py-10 border-b border-[#2C3446]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            
            {/* Movie Poster */}
            <div className="w-48 sm:w-60 aspect-[2/3] rounded-lg overflow-hidden border border-white/20 shadow-2xl flex-shrink-0 bg-black">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Movie Meta Information */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {movie.title}
              </h1>

              {/* Rating Card */}
              <div className="inline-flex items-center space-x-4 bg-[#2C3446] p-3 rounded-lg border border-white/10">
                <div className="flex items-center space-x-1.5">
                  <Star className="w-5 h-5 text-[#F84464] fill-[#F84464]" />
                  <span className="text-lg font-bold text-white">{avgRating}/10</span>
                  <span className="text-xs text-[#AAAAAA] ml-1">({movie.reviews?.length || 42}K Votes)</span>
                </div>
                <div className="h-6 w-px bg-white/20" />
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-[#222222] text-xs font-bold rounded transition shadow-sm"
                >
                  Rate now
                </button>
              </div>

              {/* Formats & Languages */}
              <div className="space-y-1 text-xs">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="px-2 py-0.5 bg-white/10 rounded text-white font-medium">
                    2D, 3D, IMAX 3D, 4DX
                  </span>
                  <span className="px-2 py-0.5 bg-white/10 rounded text-white font-medium">
                    {movie.language}
                  </span>
                </div>
                <p className="text-[#CCCCCC] pt-1">
                  {movie.durationMinutes} mins • {movie.genres?.map((g) => g.name).join(', ')} • {movie.certification} • {new Date(movie.releaseDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Prominent Red Book Tickets Button */}
              <div className="pt-2">
                <button
                  onClick={scrollToBookings}
                  className="px-10 py-3 bg-[#F84464] hover:bg-[#E03756] text-white font-bold text-sm rounded-lg transition shadow-md"
                >
                  Book tickets
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Date Selector & Theatre Showtimes */}
        <div id="showtimes-section" className="lg:col-span-2 space-y-6">
          
          {/* Horizontal Date Selector (BookMyShow clean box tabs) */}
          <div className="bg-white border border-[#E5E5E5] rounded-lg p-3 shadow-bms flex items-center space-x-2 overflow-x-auto">
            {dateOptions.map((opt, idx) => (
              <button
                key={opt.offset}
                onClick={() => setSelectedDateIndex(idx)}
                className={`flex-shrink-0 px-4 py-2 rounded text-center transition min-w-[72px] ${
                  selectedDateIndex === idx
                    ? 'bg-[#F84464] text-white font-bold shadow-sm'
                    : 'bg-white hover:bg-[#F9F9F9] text-[#222222] border border-[#E5E5E5]'
                }`}
              >
                <span className="block text-[10px] font-bold tracking-wider">{opt.dayShort}</span>
                <span className="block text-base font-black leading-tight">{opt.dateNum}</span>
                <span className="block text-[10px] font-medium">{opt.monthShort}</span>
              </button>
            ))}
          </div>

          {/* Filter Bar (Formats / Timings) */}
          <div className="bg-white border border-[#E5E5E5] rounded-lg p-3 shadow-bms flex flex-wrap items-center justify-between text-xs text-[#555555]">
            <span className="font-semibold text-[#222222]">Theatres Screening in {selectedCity}</span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#1EA83C]" />
                <span className="text-[11px]">AVAILABLE</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[11px]">FAST FILLING</span>
              </span>
            </div>
          </div>

          {/* Theatres & Showtimes List */}
          <div className="space-y-4">
            {Object.keys(groupedTheatres).length === 0 ? (
              <div className="bg-white border border-[#E5E5E5] rounded-lg p-10 text-center text-[#888888]">
                <MapPin className="w-8 h-8 text-[#CCCCCC] mx-auto mb-2" />
                <h4 className="font-bold text-[#222222] text-sm">No Showtimes Found</h4>
                <p className="text-xs text-[#777777] mt-1">There are no screenings scheduled in {selectedCity} on this date.</p>
              </div>
            ) : (
              Object.values(groupedTheatres).map(({ theatre, shows: tShows }) => (
                <div
                  key={theatre.id}
                  className="bg-white border border-[#E5E5E5] rounded-lg p-5 shadow-bms space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-[#888888] hover:text-[#F84464] cursor-pointer transition" />
                        <h3 className="font-bold text-[#222222] text-sm sm:text-base">
                          {theatre.name}
                        </h3>
                      </div>
                      <p className="text-xs text-[#666666] mt-0.5 ml-6">
                        {theatre.address}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-[#1EA83C] font-medium hidden sm:flex">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>M-Ticket</span>
                    </div>
                  </div>

                  {/* Clean Horizontal Showtimes Grid */}
                  <div className="pt-2 pl-6 flex flex-wrap items-center gap-3">
                    {tShows.map((show) => {
                      const startTime = new Date(show.startTime);
                      const timeStr = startTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      });

                      return (
                        <button
                          key={show.id}
                          onClick={() => navigate(`/shows/${show.id}/seats`)}
                          className="px-4 py-2 rounded bg-white border border-[#1EA83C] text-[#1EA83C] hover:bg-[#1EA83C] hover:text-white transition text-center shadow-xs group"
                        >
                          <span className="block text-xs font-bold leading-tight">
                            {timeStr}
                          </span>
                          <span className="block text-[9px] uppercase tracking-wider text-[#666666] group-hover:text-white/90">
                            {show.screen?.screenType}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Column: About Movie & Cast / Reviews */}
        <div className="space-y-6">
          
          {/* About The Movie Card */}
          <div className="bg-white border border-[#E5E5E5] rounded-lg p-5 shadow-bms space-y-2">
            <h3 className="font-bold text-sm text-[#222222]">About the Movie</h3>
            <p className="text-xs text-[#555555] leading-relaxed">
              {movie.description}
            </p>
          </div>

          {/* Cast & Crew Section */}
          <div className="bg-white border border-[#E5E5E5] rounded-lg p-5 shadow-bms space-y-3">
            <h3 className="font-bold text-sm text-[#222222]">Cast & Crew</h3>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="space-y-1">
                <div className="w-14 h-14 rounded-full bg-[#EEEEEE] mx-auto overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                    alt="Actor"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="font-bold text-[#222222] text-[11px] truncate">Timothée C.</p>
                <p className="text-[10px] text-[#888888]">Actor</p>
              </div>

              <div className="space-y-1">
                <div className="w-14 h-14 rounded-full bg-[#EEEEEE] mx-auto overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
                    alt="Actor"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="font-bold text-[#222222] text-[11px] truncate">Zendaya</p>
                <p className="text-[10px] text-[#888888]">Actor</p>
              </div>

              <div className="space-y-1">
                <div className="w-14 h-14 rounded-full bg-[#EEEEEE] mx-auto overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
                    alt="Director"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="font-bold text-[#222222] text-[11px] truncate">Denis V.</p>
                <p className="text-[10px] text-[#888888]">Director</p>
              </div>
            </div>
          </div>

          {/* User Reviews */}
          <div className="bg-white border border-[#E5E5E5] rounded-lg p-5 shadow-bms space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0F0F0]">
              <h3 className="font-bold text-sm text-[#222222]">Top Reviews</h3>
              <button
                onClick={() => setShowReviewModal(true)}
                className="text-xs font-bold text-[#F84464] hover:underline"
              >
                Write Review
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {movie.reviews?.length === 0 ? (
                <p className="text-xs text-[#888888] italic text-center py-2">
                  No reviews yet. Be the first to share your thoughts!
                </p>
              ) : (
                movie.reviews?.map((r) => (
                  <div key={r.id} className="p-3 bg-[#F9F9F9] rounded border border-[#E5E5E5] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#222222]">{r.userName}</span>
                      <span className="flex items-center space-x-1 text-[#F84464] font-bold text-[11px]">
                        <Star className="w-3 h-3 fill-[#F84464]" />
                        <span>{r.rating}/10</span>
                      </span>
                    </div>
                    {r.comment && <p className="text-[#555555]">{r.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="bg-white border border-[#E5E5E5] rounded-lg max-w-sm w-full p-6 text-[#222222] shadow-2xl">
            <h3 className="font-bold text-sm mb-3">Rate {movie.title}</h3>

            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#555555] font-medium mb-1">
                  Rating: <span className="font-bold text-[#F84464]">{userRating}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={userRating}
                  onChange={(e) => setUserRating(e.target.value)}
                  className="w-full accent-[#F84464] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[#555555] font-medium mb-1">Your Review</label>
                <textarea
                  rows="3"
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="What did you think of the direction, music, or performance?"
                  className="w-full p-2 border border-[#E5E5E5] rounded text-xs focus:outline-none focus:border-[#F84464]"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2 border border-[#E5E5E5] text-[#666666] font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="flex-1 py-2 bg-[#F84464] hover:bg-[#E03756] text-white font-bold rounded"
                >
                  {reviewSubmitting ? 'Posting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
