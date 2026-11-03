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
      <div className="bg-[#F8F9FA] min-h-screen py-32 text-center text-[#64748B]">
        <div className="w-8 h-8 border-2 border-[#E5B642] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium">Loading your purchase history...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24 pt-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="pb-4 border-b border-[#E2E8F0] mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#1E232A]">Your Purchase History</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Manage your confirmed tickets and view M-Ticket passes.
            </p>
          </div>
          <Link
            to="/"
            className="text-xs font-bold text-[#E5B642] hover:underline"
          >
            Explore Movies →
          </Link>
        </div>

        {actionMsg && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-subtle">
            <Ticket className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1E232A]">No Orders Found</h3>
            <p className="text-xs text-[#64748B] mt-1 mb-5">
              You haven't booked any movie tickets yet.
            </p>
            <Link
              to="/"
              className="px-6 py-2.5 bg-[#E5B642] hover:bg-[#D4A333] text-[#1E232A] text-xs font-bold rounded-full transition shadow-xs"
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
                  className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#E5B642] transition shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-4">
                    {booking.moviePosterUrl ? (
                      <img
                        src={booking.moviePosterUrl}
                        alt={booking.movieTitle}
                        className="w-16 h-20 object-cover rounded-lg border border-[#E2E8F0] flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-20 bg-[#F8F9FA] rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] flex-shrink-0">
                        <Film className="w-6 h-6" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm sm:text-base text-[#1E232A]">
                          {booking.movieTitle}
                        </h3>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isConfirmed
                              ? 'bg-[#FEF9EE] text-[#E5B642] border border-[#F2D38A]'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <p className="text-xs text-[#64748B]">
                        {booking.theatreName} — {booking.screenName} ({booking.theatreCity})
                      </p>

                      <p className="text-xs text-[#1E232A] font-semibold">
                        {showDate}
                      </p>

                      <p className="text-xs text-[#64748B]">
                        Seats: <span className="font-bold text-[#1E232A]">{booking.seats?.map((s) => `${s.row}${s.number}`).join(', ')}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end space-y-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
                    <span className="text-base font-black text-[#1E232A]">
                      ₹{booking.totalAmount?.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] font-mono">
                      Ref: {booking.bookingRef}
                    </span>

                    <div className="flex space-x-2 pt-1">
                      <Link
                        to={`/confirmation/${booking.bookingRef}`}
                        state={{ booking }}
                        className="px-3 py-1 bg-white border border-[#E2E8F0] hover:border-[#E5B642] text-[#1E232A] hover:text-[#E5B642] text-xs font-semibold rounded-full transition"
                      >
                        View Ticket
                      </Link>

                      {isConfirmed && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="px-3 py-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-full transition"
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
