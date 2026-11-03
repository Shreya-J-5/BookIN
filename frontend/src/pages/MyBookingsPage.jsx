import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { graphqlRequest } from '../services/graphqlClient';
import { useAuth } from '../context/AuthContext';
import { Ticket, Calendar, Clock, MapPin, AlertCircle, XCircle, ChevronRight, Film } from 'lucide-react';

export default function MyBookingsPage() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    async function loadBookings() {
      setLoading(true);
      try {
        const query = `
          query {
            myBookings {
              id
              bookingRef
              totalAmount
              discountAmount
              convenienceFee
              taxAmount
              status
              qrPayload
              createdAt
              movieTitle
              moviePosterUrl
              theatreName
              screenName
              theatreCity
              startTime
              seats {
                row
                number
                tier
                price
              }
            }
          }
        `;
        const data = await graphqlRequest(query);
        setBookings(data.myBookings || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, [isAuthenticated]);

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking? A ₹50 cancellation fee applies.')) {
      return;
    }

    setCancellingId(bookingId);
    setActionMsg('');
    try {
      const mutation = `
        mutation CancelBooking($bookingId: UUID!) {
          cancelBooking(bookingId: $bookingId) {
            success
            message
            refundAmount
          }
        }
      `;
      const data = await graphqlRequest(mutation, { bookingId });
      setActionMsg(`Booking cancelled. Refund of ₹${data.cancelBooking.refundAmount.toFixed(2)} initiated.`);
      
      // Update local state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-32 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm font-medium">Loading your booking history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#242938] mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center space-x-2">
              <Ticket className="w-6 h-6 text-rose-500" />
              <span>My Movie Bookings</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              View your digital tickets and manage reservations
            </p>
          </div>
          <Link
            to="/"
            className="px-4 py-2 bg-[#161922] hover:bg-slate-800 border border-[#242938] text-white rounded-xl text-xs font-semibold transition"
          >
            Explore Movies
          </Link>
        </div>

        {actionMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
            {actionMsg}
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-[#161922] border border-[#242938] rounded-2xl p-12 text-center text-slate-400">
            <Film className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Tickets Booked Yet</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              You haven't made any bookings yet. Grab your seat for the latest movies!
            </p>
            <Link
              to="/"
              className="px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-900/30"
            >
              Browse Movies Now
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-[#161922] border border-[#242938] rounded-2xl p-6 transition hover:border-slate-700 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#242938]">
                  <div className="flex items-start space-x-4">
                    {b.moviePosterUrl && (
                      <img
                        src={b.moviePosterUrl}
                        alt={b.movieTitle}
                        className="w-14 h-20 object-cover rounded-xl border border-[#242938] flex-shrink-0"
                      />
                    )}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Booking Ref: <span className="text-white font-mono">{b.bookingRef}</span>
                      </span>
                      <h2 className="text-lg font-bold text-white mt-0.5">{b.movieTitle}</h2>
                      <p className="text-xs text-slate-400">
                        {b.theatreName} • {b.screenName} ({b.theatreCity})
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {b.status}
                    </span>
                    <p className="text-base font-black text-rose-500 mt-1">₹{b.totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Show details & Seats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Showtime</span>
                    <span className="font-semibold text-white">
                      {new Date(b.startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Seats</span>
                    <span className="font-bold text-rose-400">
                      {b.seats?.map((s) => `${s.row}${s.number}`).join(', ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Booked On</span>
                    <span className="font-medium text-slate-300">
                      {new Date(b.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Action footer */}
                <div className="pt-4 border-t border-[#242938]/60 flex items-center justify-between">
                  <Link
                    to={`/confirmation/${b.bookingRef}`}
                    state={{ booking: b }}
                    className="text-xs font-semibold text-rose-500 hover:underline flex items-center space-x-1"
                  >
                    <span>View QR Ticket</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      disabled={cancellingId === b.id}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition disabled:opacity-50"
                    >
                      {cancellingId === b.id ? 'Cancelling...' : 'Cancel Ticket'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
