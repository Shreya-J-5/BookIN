import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { graphqlRequest } from '../services/graphqlClient';
import { useAuth } from '../context/AuthContext';
import { Film, Clock, Calendar, Star, MapPin, ChevronRight, Play, MessageSquarePlus } from 'lucide-react';

export default function MovieDetailsPage() {
  const { slug } = useParams();
  const { selectedCity, user, isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Review Form
  const [userRating, setUserRating] = useState(9);
  const [userComment, setUserComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Generate 3 consecutive dates: Today, Tomorrow, Day 3
  const dateOptions = [0, 1, 2].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      offset,
      dayName: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateFormatted: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      isoDate: d.toISOString().split('T')[0]
    };
  });

  const selectedDate = dateOptions[selectedDateIndex];

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
          // Fetch shows for this movie in selected city
          const showsQuery = `
            query GetMovieShows($movieId: UUID!, $city: String!) {
              shows(movieId: $movieId, city: $city) {
                id
                startTime
                endTime
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
      setReviewSuccess(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-32 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm font-medium">Loading movie details & showtimes...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen py-32 text-center text-white">
        <h2 className="text-2xl font-bold">Movie Not Found</h2>
        <Link to="/" className="text-rose-500 underline text-sm mt-2 inline-block">
          Return to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Backdrop Header */}
      <div className="relative w-full h-[360px] sm:h-[440px] overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14] via-[#0c0e14]/80 to-[#0c0e14]/30 z-10" />
        <img
          src={movie.bannerUrl || movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-50"
        />

        <div className="absolute inset-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-8 w-full">
            {/* Movie Poster */}
            <div className="w-36 sm:w-48 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-[#242938] shadow-2xl bg-black flex-shrink-0">
              <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
            </div>

            {/* Info */}
            <div className="space-y-2.5 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-bold">
                  {movie.certification}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white text-xs font-semibold backdrop-blur-md">
                  {movie.language}
                </span>
                <span className="text-xs text-slate-300 font-medium flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  <span>{movie.durationMinutes} mins</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                {movie.genres?.map((g) => g.name).join(' • ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Showtimes & Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Date Picker & Theatre Showtimes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date Picker Filter */}
          <div className="bg-[#161922] border border-[#242938] rounded-2xl p-4 flex items-center space-x-3 overflow-x-auto">
            {dateOptions.map((opt, idx) => (
              <button
                key={opt.offset}
                onClick={() => setSelectedDateIndex(idx)}
                className={`flex-shrink-0 px-5 py-3 rounded-xl flex flex-col items-center transition ${
                  selectedDateIndex === idx
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                    : 'bg-[#0c0e14] text-slate-300 hover:border-slate-600 border border-[#242938]'
                }`}
              >
                <span className="text-[11px] font-bold uppercase">{opt.dayName}</span>
                <span className="text-sm font-black">{opt.dateFormatted}</span>
              </button>
            ))}
          </div>

          {/* Showtimes List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-rose-500" />
              <span>Available Theatres in {selectedCity}</span>
            </h2>

            {Object.keys(groupedTheatres).length === 0 ? (
              <div className="bg-[#161922] border border-[#242938] rounded-2xl p-8 text-center text-slate-400">
                <MapPin className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">No showtimes found in {selectedCity}</p>
                <p className="text-xs text-slate-400 mt-1">Please select another date or change your city in the top navigation.</p>
              </div>
            ) : (
              Object.values(groupedTheatres).map(({ theatre, shows: tShows }) => (
                <div
                  key={theatre.id}
                  className="bg-[#161922] border border-[#242938] rounded-2xl p-6 transition hover:border-slate-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#242938]">
                    <div>
                      <h3 className="font-bold text-white text-base">{theatre.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{theatre.address}</p>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-400 mt-2 sm:mt-0 flex items-center space-x-1">
                      <span>✓ M-Ticket Available</span>
                    </span>
                  </div>

                  {/* Showtime Pills */}
                  <div className="pt-4 flex flex-wrap items-center gap-3">
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
                          className="group px-4 py-2 bg-[#0c0e14] border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-xl transition text-left"
                        >
                          <div className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                            {timeStr}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {show.screen.screenType}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Synopsis & Reviews */}
        <div className="space-y-6">
          {/* Synopsis */}
          <div className="bg-[#161922] border border-[#242938] rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-bold text-white">About the Movie</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {movie.description}
            </p>
          </div>

          {/* Customer Reviews & Ratings */}
          <div className="bg-[#161922] border border-[#242938] rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Star className="w-4 h-4 text-amber-400 fill-current" />
              <span>Audience Reviews ({movie.reviews?.length || 0})</span>
            </h3>

            {/* Submit Review */}
            <form onSubmit={handleReviewSubmit} className="space-y-3 pt-2 border-t border-[#242938]">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Rating (1 to 10)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={userRating}
                    onChange={(e) => setUserRating(e.target.value)}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <span className="px-2 py-0.5 rounded bg-rose-600 font-bold text-xs text-white">
                    {userRating}/10
                  </span>
                </div>
              </div>

              <div>
                <textarea
                  rows="2"
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="Share your review of the direction, screenplay, or sound..."
                  className="w-full p-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold rounded-xl text-xs transition"
              >
                {reviewSubmitting ? 'Posting...' : 'Post Review'}
              </button>
            </form>

            {/* Reviews List */}
            <div className="space-y-3 pt-2 max-h-72 overflow-y-auto">
              {movie.reviews?.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-2">
                  Be the first to review this movie!
                </p>
              ) : (
                movie.reviews?.map((r) => (
                  <div key={r.id} className="p-3 bg-[#0c0e14] rounded-xl border border-[#242938]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{r.userName}</span>
                      <span className="flex items-center space-x-1 text-[11px] text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{r.rating}/10</span>
                      </span>
                    </div>
                    {r.comment && <p className="text-xs text-slate-300 mt-1">{r.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
