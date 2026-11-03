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
  Play,
  Film
} from 'lucide-react';

export default function MovieDetailsPage() {
  const { slug } = useParams();
  const { selectedCity = 'Ahmedabad', user, isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Review state
  const [userRating, setUserRating] = useState(4);
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
      <div className="min-h-screen py-32 text-center text-[#666666] bg-[#FFFFFF]">
        <div className="w-8 h-8 border-2 border-[#D5A936] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium">Loading movie details & showtimes...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen py-32 text-center text-[#202020] bg-[#FFFFFF]">
        <h2 className="text-xl font-bold">Movie Not Found</h2>
        <Link to="/" className="text-[#D5A936] text-xs font-semibold underline mt-2 inline-block">
          Return to Movies
        </Link>
      </div>
    );
  }

  const avgRating =
    movie.reviews?.length > 0
      ? (movie.reviews.reduce((acc, r) => acc + r.rating, 0) / movie.reviews.length).toFixed(1)
      : '4.0';

  return (
    <div className="bg-[#FFFFFF] min-h-screen pb-20">
      
      {/* 1. Cinematic Movie Hero Strip (Light background with crisp borders) */}
      <div className="bg-[#F5F5F5] border-b border-[#DADADA] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            
            {/* Movie Poster */}
            <div className="w-48 sm:w-56 aspect-[2/3] rounded-sm overflow-hidden border border-[#DADADA] shadow-card flex-shrink-0 bg-white">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Movie Meta Information */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#202020]">
                {movie.title}
              </h1>

              {/* Rating Card with Gold Accent */}
              <div className="inline-flex items-center space-x-4 bg-white p-2.5 rounded-sm border border-[#DADADA]">
                <div className="flex items-center space-x-1.5">
                  <Star className="w-4 h-4 text-[#D5A936] fill-[#D5A936]" />
                  <span className="text-base font-bold text-[#202020]">{avgRating} / 5</span>
                  <span className="text-xs text-[#666666] ml-1">({movie.reviews?.length || 4} Ratings)</span>
                </div>
                <div className="h-5 w-px bg-[#DADADA]" />
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="px-3 py-1 bg-[#F5F5F5] hover:bg-[#FBF6EA] border border-[#DADADA] hover:border-[#D5A936] text-[#202020] hover:text-[#D5A936] text-xs font-semibold rounded-sm transition"
                >
                  Rate now
                </button>
              </div>

              {/* Formats & Languages */}
              <div className="space-y-1.5 text-xs text-[#202020]">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="px-2.5 py-0.5 bg-white border border-[#DADADA] rounded-sm text-[#202020] font-medium">
                    2D, 3D, IMAX 3D, Dolby Atmos
                  </span>
                  <span className="px-2.5 py-0.5 bg-white border border-[#DADADA] rounded-sm text-[#202020] font-medium">
                    {movie.language}
                  </span>
                </div>
                <p className="text-[#666666] pt-1">
                  {movie.durationMinutes} mins • {movie.genres?.map((g) => g.name).join(', ')} • {movie.certification} • {new Date(movie.releaseDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Gold Book Tickets Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={scrollToBookings}
                  className="px-8 py-2.5 bg-[#D5A936] hover:bg-[#C2982B] text-[#1A1A1A] font-bold text-sm rounded-sm transition shadow-sm"
                >
                  Book Tickets
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. Main Content & Showtimes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        
        {/* Showtimes & Date Picker */}
        <div id="showtimes-section" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DADADA] gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#202020]">Showtimes in {selectedCity}</h2>
              <p className="text-xs text-[#666666] mt-0.5">Select your preferred date and auditorium time slot.</p>
            </div>

            {/* Date Picker Tabs (Boxy light tabs) */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {dateOptions.map((dateObj, idx) => (
                <button
                  key={dateObj.offset}
                  onClick={() => setSelectedDateIndex(idx)}
                  className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-sm border transition text-center min-w-[65px] ${
                    selectedDateIndex === idx
                      ? 'bg-[#D5A936] text-[#202020] border-[#D5A936] font-bold shadow-sm'
                      : 'bg-white text-[#666666] border-[#DADADA] hover:border-[#D5A936]'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold">{dateObj.dayShort}</span>
                  <span className="text-base font-extrabold leading-none my-0.5">{dateObj.dateNum}</span>
                  <span className="text-[9px] uppercase font-semibold">{dateObj.monthShort}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Formats Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', '2D', 'IMAX 3D', '4DX', 'Dolby Atmos 2D'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-1 text-xs rounded-sm transition font-medium border ${
                  selectedFormat === fmt
                    ? 'bg-[#26343C] text-white border-[#26343C]'
                    : 'bg-white text-[#666666] border-[#DADADA] hover:text-[#202020]'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Theatres & Showtimes List */}
          <div className="space-y-4">
            {Object.keys(groupedTheatres).length === 0 ? (
              <div className="bg-white border border-[#DADADA] rounded-sm p-12 text-center text-[#666666]">
                <Calendar className="w-10 h-10 text-[#DADADA] mx-auto mb-2" />
                <h4 className="font-bold text-sm text-[#202020]">No Scheduled Shows for {dateOptions[selectedDateIndex].dayShort}</h4>
                <p className="text-xs text-[#888888] mt-1">Please select another date or explore other cities.</p>
              </div>
            ) : (
              Object.values(groupedTheatres).map(({ theatre, shows: tShows }) => {
                const filteredShows =
                  selectedFormat === 'ALL'
                    ? tShows
                    : tShows.filter((s) => s.screen?.screenType?.toLowerCase().includes(selectedFormat.toLowerCase()));

                if (filteredShows.length === 0) return null;

                return (
                  <div
                    key={theatre.id}
                    className="bg-white border border-[#DADADA] rounded-sm p-5 hover:border-[#D5A936] transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left: Theatre Name & Details */}
                      <div className="md:w-1/3">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-sm text-[#202020]">{theatre.name}</h3>
                          <Info className="w-3.5 h-3.5 text-[#888888] cursor-pointer" title={theatre.address} />
                        </div>
                        <p className="text-xs text-[#666666] mt-1 flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-[#888888] flex-shrink-0" />
                          <span className="truncate">{theatre.address || theatre.city}</span>
                        </p>
                        <div className="flex items-center space-x-3 mt-2 text-[11px] text-[#666666]">
                          <span className="text-emerald-700 font-medium">✓ M-Ticket Available</span>
                          <span>•</span>
                          <span className="text-[#666666]">Food & Beverage</span>
                        </div>
                      </div>

                      {/* Right: Show Timings Grid */}
                      <div className="flex-1 flex flex-wrap items-center gap-3">
                        {filteredShows.map((s) => {
                          const date = new Date(s.startTime);
                          const timeString = date.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          });

                          return (
                            <Link
                              key={s.id}
                              to={`/shows/${s.id}/seats`}
                              className="group relative flex flex-col items-center justify-center px-4 py-2 bg-white border border-[#DADADA] hover:border-[#D5A936] rounded-sm transition min-w-[95px] text-center"
                            >
                              <span className="text-xs font-bold text-[#202020] group-hover:text-[#D5A936]">
                                {timeString}
                              </span>
                              <span className="text-[10px] text-[#666666] mt-0.5">
                                {s.screen?.name || 'Screen 1'}
                              </span>
                              <span className="text-[9px] text-[#888888]">
                                {s.screen?.screenType}
                              </span>
                            </Link>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. About Movie / Synopsis */}
        <div className="border-t border-[#DADADA] pt-8">
          <h3 className="text-lg font-bold text-[#202020] mb-3">About the Movie</h3>
          <p className="text-xs sm:text-sm text-[#555555] leading-relaxed max-w-4xl">
            {movie.description || 'An extraordinary theatrical spectacle featuring acclaimed direction, visual effects, and compelling storytelling.'}
          </p>
        </div>

        {/* 4. Cast & Crew Cards */}
        <div className="border-t border-[#DADADA] pt-8">
          <h3 className="text-lg font-bold text-[#202020] mb-4">Cast & Crew</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {[
              { name: 'Lead Actor', role: 'Main Character', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
              { name: 'Co-Star', role: 'Supporting Cast', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80' },
              { name: 'Director', role: 'Directing & Story', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
              { name: 'Music Composer', role: 'Original Score', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' },
            ].map((c, i) => (
              <div key={i} className="text-center bg-white border border-[#DADADA] rounded-sm p-3">
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-2 border border-[#DADADA]">
                  <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-bold text-xs text-[#202020] truncate">{c.name}</h4>
                <p className="text-[10px] text-[#666666] truncate">{c.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Customer Reviews */}
        <div className="border-t border-[#DADADA] pt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#202020]">User Reviews</h3>
              <p className="text-xs text-[#666666]">Verified feedback from moviegoers who watched this title.</p>
            </div>
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-1.5 bg-white border border-[#DADADA] hover:border-[#D5A936] text-[#202020] hover:text-[#D5A936] text-xs font-semibold rounded-sm transition"
            >
              Write Review
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {movie.reviews?.length === 0 ? (
              <p className="text-xs text-[#888888] col-span-full">No reviews submitted yet. Be the first to rate!</p>
            ) : (
              movie.reviews?.map((r) => (
                <div key={r.id} className="bg-white border border-[#DADADA] rounded-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-[#202020]">{r.userName || 'Verified Moviegoer'}</span>
                    <div className="flex items-center text-[#D5A936] text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-[#D5A936] mr-1" />
                      <span>{r.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#555555]">{r.comment || 'Thrilling theatre experience!'}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white border border-[#DADADA] rounded-sm shadow-xl p-6 max-w-sm w-full text-[#202020]">
            <h3 className="font-bold text-base mb-1">Rate "{movie.title}"</h3>
            <p className="text-xs text-[#666666] mb-4">Share your thoughts on the performance and cinema sound.</p>
            
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#444444] mb-1">Score (1 to 5 Stars)</label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setUserRating(s)}
                      className="p-1 text-[#D5A936]"
                    >
                      <Star className={`w-6 h-6 ${s <= userRating ? 'fill-[#D5A936]' : 'text-[#DADADA]'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#444444] mb-1">Your Review</label>
                <textarea
                  rows="3"
                  required
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="The soundtrack and visuals were fantastic..."
                  className="w-full p-2.5 bg-white border border-[#DADADA] rounded-sm text-xs text-[#202020] focus:outline-none focus:border-[#D5A936]"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2 bg-white border border-[#DADADA] text-[#666666] text-xs font-semibold rounded-sm hover:bg-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="flex-1 py-2 bg-[#D5A936] hover:bg-[#C2982B] text-[#1A1A1A] text-xs font-bold rounded-sm transition"
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
