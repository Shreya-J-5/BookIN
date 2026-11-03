import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { graphqlRequest } from '../services/graphqlClient';
import { useAuth } from '../context/AuthContext';
import { Ticket, Film, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

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
    if (!confirm('Are you sure you want to cancel this booking? A Rs. 50 cancellation fee applies.')) {
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
      setActionMsg(`Booking cancelled. Refund of Rs. ${data.cancelBooking.refundAmount.toFixed(2)} initiated.`);
      
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
      <div className="bg-[#F5F5F5] min-h-screen py-32 text-center text-[#888888]">
        <div className="w-8 h-8 border-2 border-[#F84464] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium">Loading your purchase history...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-24 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5] mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#222222] flex items-center space-x-2">
              <Ticket className="w-5 h-5 text-[#F84464]" />
              <span>Your Orders & Tickets</span>
            </h1>
            <p className="text-xs text-[#666666] mt-0.5">
              Manage your confirmed movie tickets & cancellations
            </p>
          </div>
          <Link
            to="/"
            className="px-3.5 py-1.5 bg-white border border-[#E5E5E5] text-[#222222] hover:bg-[#F9F9F9] rounded text-xs font-semibold transition"
          >
            Explore Movies
          </Link>
        </div>

        {actionMsg && (
          <div className="mb-5 p-3 bg-[#EAFBF0] border border-[#BDEECF] rounded text-[#116928] text-xs">
            {actionMsg}
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white border border-[#E5E5E5] rounded-lg p-10 text-center text-[#888888] shadow-bms">
            <Film className="w-10 h-10 text-[#CCCCCC] mx-auto mb-2" />
            <h3 className="font-bold text-[#222222] text-sm">No Bookings Yet</h3>
            <p className="text-xs text-[#777777] mt-1 mb-5">
              You haven't purchased any tickets yet. Catch the latest blockbuster now!
            </p>
            <Link
              to="/"
              className="px-5 py-2 bg-[#F84464] hover:bg-[#E03756] text-white font-bold rounded text-xs transition"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-white border border-[#E5E5E5] rounded-lg p-5 shadow-bms space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-[#F0F0F0]">
                  <div className="flex items-start space-x-3.5">
                    {b.moviePosterUrl && (
                      <img
                        src={b.moviePosterUrl}
                        alt={b.movieTitle}
                        className="w-12 h-18 object-cover rounded border border-[#E5E5E5] flex-shrink-0"
                      />
                    )}
                    <div>
                      <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                        Booking ID: <span className="font-mono text-[#222222]">{b.bookingRef}</span>
                      </span>
                      <h2 className="text-base font-bold text-[#222222] mt-0.5">{b.movieTitle}</h2>
                      <p className="text-xs text-[#666666]">
                        {b.theatreName} ({b.theatreCity}) • {b.screenName}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'CONFIRMED'
                          ? 'bg-[#EAFBF0] text-[#116928] border border-[#BDEECF]'
                          : 'bg-[#FFF1F3] text-[#F84464] border border-[#F84464]/30'
                      }`}
                    >
                      {b.status}
                    </span>
                    <p className="text-sm font-bold text-[#222222] mt-1">Rs. {b.totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Show Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#555555]">
                  <div>
                    <span className="text-[#888888] block text-[11px]">Showtime</span>
                    <span className="font-semibold text-[#222222]">
                      {new Date(b.startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#888888] block text-[11px]">Seats</span>
                    <span className="font-bold text-[#F84464]">
                      {b.seats?.map((s) => `${s.row}${s.number}`).join(', ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#888888] block text-[11px]">Booked On</span>
                    <span className="text-[#555555]">
                      {new Date(b.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-[#F0F0F0] flex items-center justify-between text-xs">
                  <Link
                    to={`/confirmation/${b.bookingRef}`}
                    state={{ booking: b }}
                    className="font-bold text-[#F84464] hover:underline flex items-center"
                  >
                    <span>View QR E-Ticket</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </Link>

                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      disabled={cancellingId === b.id}
                      className="px-3 py-1 bg-white hover:bg-[#FFF1F3] text-[#F84464] border border-[#F84464]/30 rounded text-xs font-semibold transition disabled:opacity-50"
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
