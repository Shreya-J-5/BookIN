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
      <div className="bg-[#FFFFFF] min-h-screen py-32 text-center text-[#666666]">
        <div className="w-8 h-8 border-2 border-[#D5A936] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium">Loading your purchase history...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] min-h-screen pb-24 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="pb-4 border-b border-[#DADADA] mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#202020]">Your Purchase History</h1>
            <p className="text-xs text-[#666666] mt-0.5">
              Manage your confirmed tickets and view M-Ticket passes.
            </p>
          </div>
          <Link
            to="/"
            className="text-xs font-bold text-[#D5A936] hover:underline"
          >
            Explore Movies →
          </Link>
        </div>

        {actionMsg && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white border border-[#DADADA] rounded-sm p-12 text-center">
            <Ticket className="w-12 h-12 text-[#DADADA] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#202020]">No Orders Found</h3>
            <p className="text-xs text-[#666666] mt-1 mb-5">
              You haven't booked any movie tickets yet.
            </p>
            <Link
              to="/"
              className="px-5 py-2.5 bg-[#D5A936] hover:bg-[#C2982B] text-[#1A1A1A] text-xs font-bold rounded-sm transition shadow-sm"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const isConfirmed = booking.status === 'CONFIRMED';
              const showDate = booking.startTime
                ? new Date(booking.startTime).toLocaleString('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Upcoming';

              return (
                <div
                  key={booking.id}
                  className="bg-white border border-[#DADADA] rounded-sm p-5 hover:border-[#D5A936] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-4">
                    {booking.moviePosterUrl ? (
                      <img
                        src={booking.moviePosterUrl}
                        alt={booking.movieTitle}
                        className="w-16 h-20 object-cover rounded-sm border border-[#DADADA] flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-20 bg-[#F5F5F5] rounded-sm border border-[#DADADA] flex items-center justify-center text-[#888888] flex-shrink-0">
                        <Film className="w-6 h-6" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm sm:text-base text-[#202020]">
                          {booking.movieTitle}
                        </h3>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                            isConfirmed
                              ? 'bg-[#FBF6EA] text-[#D5A936] border border-[#E2C36E]'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <p className="text-xs text-[#666666]">
                        {booking.theatreName} — {booking.screenName} ({booking.theatreCity})
                      </p>

                      <p className="text-xs text-[#202020] font-semibold">
                        {showDate}
                      </p>

                      <p className="text-xs text-[#666666]">
                        Seats: <span className="font-bold text-[#202020]">{booking.seats?.map((s) => `${s.row}${s.number}`).join(', ')}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end space-y-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#F5F5F5]">
                    <span className="text-base font-black text-[#202020]">
                      ₹{booking.totalAmount?.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#888888] font-mono">
                      Ref: {booking.bookingRef}
                    </span>

                    <div className="flex space-x-2 pt-1">
                      <Link
                        to={`/confirmation/${booking.bookingRef}`}
                        state={{ booking }}
                        className="px-3 py-1 bg-white border border-[#DADADA] hover:border-[#D5A936] text-[#202020] hover:text-[#D5A936] text-xs font-semibold rounded-sm transition"
                      >
                        View Ticket
                      </Link>

                      {isConfirmed && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="px-3 py-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-sm transition"
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
