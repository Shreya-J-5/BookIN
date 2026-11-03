import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { graphqlRequest } from '../services/graphqlClient';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, AlertCircle, ChevronRight } from 'lucide-react';

export default function SeatSelectionPage() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [show, setShow] = useState(null);
  const [showSeats, setShowSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [wsConnected, setWsConnected] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    async function loadShowData() {
      setLoading(true);
      setErrorMsg('');
      try {
        const query = `
          query GetShowDetails($showId: UUID!) {
            show(id: $showId) {
              id
              startTime
              basePrices
              movie {
                title
                certification
                language
                durationMinutes
              }
              screen {
                name
                screenType
                theatre {
                  name
                  address
                  city
                }
              }
            }
            showSeats(showId: $showId) {
              id
              seatId
              row
              number
              tier
              price
              status
              isAccessible
            }
          }
        `;
        const data = await graphqlRequest(query, { showId });
        setShow(data.show);
        setShowSeats(data.showSeats || []);
      } catch (err) {
        console.error('Error fetching show seats:', err);
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadShowData();
  }, [showId]);

  useEffect(() => {
    if (!showId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/shows/${showId}`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setWsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SEAT_STATUS_CHANGED' && data.seatId) {
          setShowSeats((prevSeats) =>
            prevSeats.map((seat) => {
              if (seat.seatId === data.seatId) {
                return { ...seat, status: data.status };
              }
              return seat;
            })
          );

          if (data.status === 'LOCKED' || data.status === 'BOOKED') {
            setSelectedSeatIds((prev) => prev.filter((id) => id !== data.seatId));
          }
        }
      } catch (e) {
        // non-json message
      }
    };

    socket.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [showId]);

  // Group showSeats by Row
  const rowsMap = {};
  showSeats.forEach((ss) => {
    if (!rowsMap[ss.row]) {
      rowsMap[ss.row] = {
        row: ss.row,
        tier: ss.tier,
        price: ss.price,
        seats: []
      };
    }
    rowsMap[ss.row].seats.push(ss);
  });

  const sortedRows = Object.values(rowsMap).sort((a, b) => a.row.localeCompare(b.row));

  const toggleSeatSelection = (seat) => {
    if (seat.status !== 'AVAILABLE') return;

    if (selectedSeatIds.includes(seat.seatId)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.seatId));
    } else {
      if (selectedSeatIds.length >= 10) {
        alert('You can select a maximum of 10 seats per booking.');
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.seatId]);
    }
  };

  const selectedSeats = showSeats.filter((ss) => selectedSeatIds.includes(ss.seatId));
  const subtotal = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);

  const handleProceedToReserve = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (selectedSeatIds.length === 0) return;

    setReserving(true);
    setErrorMsg('');

    try {
      const mutation = `
        mutation ReserveSeats($showId: UUID!, $seatIds: [UUID!]!) {
          reserveSeats(showId: $showId, seatIds: $seatIds) {
            reservationId
            expiresAt
            status
            reservedSeatsCount
            totalPrice
            seatLabels
          }
        }
      `;
      const data = await graphqlRequest(mutation, {
        showId,
        seatIds: selectedSeatIds
      });

      const reservation = data.reserveSeats;

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        selectedSeatIds.forEach((sid) => {
          socketRef.current.send(
            JSON.stringify({
              action: 'SEAT_UPDATE',
              seatId: sid,
              status: 'LOCKED',
              userId: user?.id
            })
          );
        });
      }

      navigate(`/checkout/${reservation.reservationId}`, {
        state: {
          reservation,
          show
        }
      });
    } catch (err) {
      setErrorMsg(err.message || 'Seat reservation failed. Please select different seats.');
      const refreshQuery = `query { showSeats(showId: "${showId}") { id seatId row number tier price status isAccessible } }`;
      graphqlRequest(refreshQuery).then((res) => setShowSeats(res.showSeats || []));
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-32 text-center text-[#64748B] bg-[#F8F9FA]">
        <div className="w-8 h-8 border-2 border-[#E5B642] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium">Loading seat map...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen py-32 text-center text-[#1E232A] bg-[#F8F9FA]">
        <h2 className="text-xl font-bold">Show Not Found</h2>
        <Link to="/" className="text-[#E5B642] text-xs font-semibold underline mt-2 inline-block">
          Return to Movies
        </Link>
      </div>
    );
  }

  const startTimeStr = new Date(show.startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-32">
      
      {/* 1. Charcoal Top Header Bar */}
      <div className="bg-[#1E232A] text-white py-3.5 sticky top-16 sm:top-20 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white">
                {show.movie.title}
              </h1>
              <p className="text-xs text-white/70">
                {show.screen.theatre.name} • {startTimeStr} • {show.screen.screenType}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-[#E5B642]' : 'bg-amber-400'}`} />
            <span className="text-[11px] text-white/70 hidden sm:inline">
              {wsConnected ? 'Live Seat Sync' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Seat Layout Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-10 shadow-card">
          
          {/* Seat Tiers & Rows */}
          <div className="space-y-8">
            {sortedRows.map(({ row, tier, price, seats }) => {
              const isPremium = tier === 'RECLINER';

              return (
                <div key={row} className="space-y-2">
                  <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider pb-1 border-b border-[#F1F5F9] flex justify-between items-center">
                    <span>{tier}</span>
                    <span>₹{price.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-center space-x-2 sm:space-x-3 py-1">
                    <span className="w-5 text-center text-xs font-bold text-[#94A3B8]">{row}</span>

                    <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap justify-center">
                      {seats
                        .sort((a, b) => a.number - b.number)
                        .map((seat) => {
                          const isSelected = selectedSeatIds.includes(seat.seatId);
                          const isAvailable = seat.status === 'AVAILABLE';
                          const isLocked = seat.status === 'LOCKED';
                          const isBooked = seat.status === 'BOOKED';

                          let seatClasses = '';
                          if (isSelected) {
                            seatClasses = 'bg-[#E5B642] border-[#E5B642] text-[#1E232A] font-bold shadow-xs';
                          } else if (isBooked) {
                            seatClasses = 'bg-[#E2E8F0] border-[#CBD5E1] text-[#94A3B8] cursor-not-allowed';
                          } else if (isLocked) {
                            seatClasses = 'bg-amber-50 border-amber-300 text-amber-700 cursor-not-allowed';
                          } else if (isPremium) {
                            seatClasses = 'bg-white border-[#F2D38A] text-[#1E232A] hover:bg-[#FEF9EE] hover:border-[#E5B642]';
                          } else {
                            seatClasses = 'bg-white border-[#CBD5E1] text-[#1E232A] hover:border-[#E5B642] hover:text-[#E5B642]';
                          }

                          return (
                            <button
                              key={seat.id}
                              disabled={!isAvailable}
                              onClick={() => toggleSeatSelection(seat)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md border text-[11px] flex items-center justify-center font-semibold transition ${seatClasses}`}
                              title={`Seat ${row}${seat.number} (${tier} - ₹${price})`}
                            >
                              {seat.number}
                            </button>
                          );
                        })}
                    </div>

                    <span className="w-5 text-center text-xs font-bold text-[#94A3B8]">{row}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Screen Indicator */}
          <div className="mt-16 text-center max-w-md mx-auto">
            <div className="w-full h-1 bg-[#CBD5E1] rounded-full mx-auto" />
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mt-2">
              All eyes this way please! (Screen)
            </p>
          </div>

          {/* Seat Legend */}
          <div className="mt-10 pt-6 border-t border-[#F1F5F9] flex flex-wrap items-center justify-center gap-6 text-xs text-[#64748B]">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-md bg-white border border-[#CBD5E1]" />
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-md bg-[#E5B642] border border-[#E5B642]" />
              <span className="font-semibold text-[#1E232A]">Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-md bg-[#E2E8F0] border border-[#CBD5E1]" />
              <span>Booked</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-md bg-white border border-[#F2D38A]" />
              <span>Premium</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Bottom Sticky Checkout Bar */}
      {selectedSeatIds.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-[#E2E8F0] py-3.5 z-40 shadow-dropdown animate-fade-in">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#64748B]">
                Seats: <span className="font-bold text-[#1E232A]">{selectedSeats.map((s) => `${s.row}${s.number}`).join(', ')}</span>
              </p>
              <p className="text-lg font-black text-[#1E232A]">
                ₹{subtotal.toFixed(2)}
              </p>
            </div>

            <button
              onClick={handleProceedToReserve}
              disabled={reserving}
              className="px-8 py-2.5 bg-[#E5B642] hover:bg-[#D4A333] text-[#1E232A] font-bold rounded-full text-xs sm:text-sm transition shadow-sm disabled:opacity-50 flex items-center space-x-2"
            >
              <span>{reserving ? 'Reserving...' : `Pay ₹${subtotal.toFixed(2)}`}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
