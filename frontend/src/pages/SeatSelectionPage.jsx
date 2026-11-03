import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { graphqlRequest } from '../services/graphqlClient';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, AlertCircle, ChevronRight, X } from 'lucide-react';

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

  // Load Show & Seat Inventory
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

  // Establish WebSocket Connection for Real-Time Seat Synchronization
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

  // Toggle seat selection
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

  // Reserve Seats Mutation
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

      // Broadcast via WebSocket
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
      <div className="min-h-screen py-32 text-center text-[#666666] bg-[#FFFFFF]">
        <div className="w-8 h-8 border-2 border-[#D5A936] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium">Loading seat map...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen py-32 text-center text-[#202020] bg-[#FFFFFF]">
        <h2 className="text-xl font-bold">Show Not Found</h2>
        <Link to="/" className="text-[#D5A936] text-xs font-semibold underline mt-2 inline-block">
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
    <div className="bg-[#FFFFFF] min-h-screen pb-32">
      
      {/* 1. Clean Top Header Bar */}
      <div className="bg-white border-b border-[#DADADA] py-3 sticky top-14 sm:top-16 z-30 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-sm hover:bg-[#F5F5F5] border border-[#DADADA] text-[#202020] transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-[#202020]">
                {show.movie.title}
              </h1>
              <p className="text-xs text-[#666666]">
                {show.screen.theatre.name} | {startTimeStr} | {show.screen.screenType}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-[#D5A936]' : 'bg-amber-400'}`} />
            <span className="text-[11px] text-[#666666] hidden sm:inline">
              {wsConnected ? 'Real-Time Sync Active' : 'Connecting Sync...'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Seat Layout Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-red-600 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Seat Layout Box */}
        <div className="bg-white border border-[#DADADA] rounded-sm p-6 sm:p-10 shadow-subtle">
          
          {/* Seat Tiers & Rows */}
          <div className="space-y-8">
            {sortedRows.map(({ row, tier, price, seats }) => {
              const isPremium = tier === 'RECLINER';

              return (
                <div key={row} className="space-y-2">
                  {/* Category Header */}
                  <div className="text-[10px] font-bold text-[#666666] uppercase tracking-wider pb-1 border-b border-[#F5F5F5] flex justify-between items-center">
                    <span>{tier}</span>
                    <span>₹{price.toFixed(2)}</span>
                  </div>

                  {/* Seats in this row */}
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3 py-1">
                    <span className="w-5 text-center text-xs font-bold text-[#666666]">{row}</span>

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
                            // Selected: Gold background, dark text
                            seatClasses = 'bg-[#D5A936] border-[#D5A936] text-[#1A1A1A] font-bold shadow-sm';
                          } else if (isBooked) {
                            // Booked: Grey
                            seatClasses = 'bg-[#EAEAEA] border-[#DADADA] text-[#AAAAAA] cursor-not-allowed';
                          } else if (isLocked) {
                            // Locked: Light amber
                            seatClasses = 'bg-amber-50 border-amber-300 text-amber-700 cursor-not-allowed';
                          } else if (isPremium) {
                            // Premium: Subtle gold border
                            seatClasses = 'bg-white border-[#E2C36E] text-[#202020] hover:bg-[#FBF6EA] hover:border-[#D5A936]';
                          } else {
                            // Available: White with subtle border
                            seatClasses = 'bg-white border-[#DADADA] text-[#202020] hover:border-[#D5A936] hover:text-[#D5A936]';
                          }

                          return (
                            <button
                              key={seat.id}
                              disabled={!isAvailable}
                              onClick={() => toggleSeatSelection(seat)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-sm border text-[11px] flex items-center justify-center font-medium transition ${seatClasses}`}
                              title={`Seat ${row}${seat.number} (${tier} - ₹${price})`}
                            >
                              {seat.number}
                            </button>
                          );
                        })}
                    </div>

                    <span className="w-5 text-center text-xs font-bold text-[#666666]">{row}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Screen Indicator */}
          <div className="mt-16 text-center max-w-md mx-auto">
            <div className="w-full h-1 bg-[#DADADA] rounded-full mx-auto" />
            <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest mt-2">
              All eyes this way please! (Screen)
            </p>
          </div>

          {/* Seat Legend */}
          <div className="mt-10 pt-6 border-t border-[#F5F5F5] flex flex-wrap items-center justify-center gap-6 text-xs text-[#555555]">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-sm bg-white border border-[#DADADA]" />
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-sm bg-[#D5A936] border border-[#D5A936]" />
              <span className="font-semibold text-[#202020]">Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-sm bg-[#EAEAEA] border border-[#DADADA]" />
              <span>Booked</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-sm bg-white border border-[#E2C36E]" />
              <span>Premium (Recliner)</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Bottom Sticky Checkout Bar */}
      {selectedSeatIds.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-[#DADADA] py-3.5 z-40 shadow-2xl animate-fade-in">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#666666]">
                Seats: <span className="font-bold text-[#202020]">{selectedSeats.map((s) => `${s.row}${s.number}`).join(', ')}</span>
              </p>
              <p className="text-lg font-black text-[#202020]">
                ₹{subtotal.toFixed(2)}
              </p>
            </div>

            <button
              onClick={handleProceedToReserve}
              disabled={reserving}
              className="px-8 py-2.5 bg-[#D5A936] hover:bg-[#C2982B] text-[#1A1A1A] font-bold rounded-sm text-xs transition shadow-sm disabled:opacity-50 flex items-center space-x-2"
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
