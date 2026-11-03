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

  // Toggle seat
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
      // Refresh seats
      const refreshQuery = `query { showSeats(showId: "${showId}") { id seatId row number tier price status isAccessible } }`;
      graphqlRequest(refreshQuery).then((res) => setShowSeats(res.showSeats || []));
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-32 text-center text-[#888888] bg-[#F5F5F5]">
        <div className="w-8 h-8 border-2 border-[#F84464] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium">Loading seat map...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen py-32 text-center text-[#222222] bg-[#F5F5F5]">
        <h2 className="text-xl font-bold">Show Not Found</h2>
        <Link to="/" className="text-[#F84464] text-xs font-semibold underline mt-2 inline-block">
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
    <div className="bg-[#F5F5F5] min-h-screen pb-32">
      
      {/* 1. Clean Top Header Bar */}
      <div className="bg-white border-b border-[#E5E5E5] py-3 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded hover:bg-[#F5F5F5] text-[#555555] transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-[#222222]">
                {show.movie.title}
              </h1>
              <p className="text-xs text-[#666666]">
                {show.screen.theatre.name} | {startTimeStr} | {show.screen.screenType}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-[#1EA83C]' : 'bg-amber-500'}`} />
            <span className="text-[11px] text-[#777777] hidden sm:inline">
              {wsConnected ? 'Live Updates Active' : 'Connecting Sync...'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Seat Layout Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-[#FFF1F3] border border-[#F84464]/30 rounded text-[#F84464] text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Seat Layout Box */}
        <div className="bg-white border border-[#E5E5E5] rounded-lg p-6 sm:p-10 shadow-bms">
          
          {/* Seat Tiers & Rows */}
          <div className="space-y-8">
            {sortedRows.map(({ row, tier, price, seats }) => {
              const isPremium = tier === 'RECLINER';

              return (
                <div key={row} className="space-y-2">
                  {/* Category Header */}
                  <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider pb-1 border-b border-[#F0F0F0]">
                    {tier} — Rs. {price.toFixed(2)}
                  </div>

                  {/* Seats in this row */}
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3 py-1">
                    <span className="w-5 text-center text-xs font-bold text-[#888888]">{row}</span>

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
                            // Selected: Green
                            seatClasses = 'bg-[#1EA83C] border-[#1EA83C] text-white font-bold';
                          } else if (isBooked) {
                            // Booked: Grey
                            seatClasses = 'bg-[#EEEEEE] border-[#DDDDDD] text-[#AAAAAA] cursor-not-allowed';
                          } else if (isLocked) {
                            // Locked: Amber
                            seatClasses = 'bg-amber-100 border-amber-300 text-amber-700 cursor-not-allowed';
                          } else if (isPremium) {
                            // Premium: Light purple border
                            seatClasses = 'bg-white border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white';
                          } else {
                            // Available: White with Green border
                            seatClasses = 'bg-white border-[#1EA83C] text-[#1EA83C] hover:bg-[#1EA83C] hover:text-white';
                          }

                          return (
                            <button
                              key={seat.id}
                              disabled={!isAvailable}
                              onClick={() => toggleSeatSelection(seat)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-sm border text-[11px] flex items-center justify-center font-medium transition ${seatClasses}`}
                              title={`Seat ${row}${seat.number} (${tier} - Rs. ${price})`}
                            >
                              {seat.number}
                            </button>
                          );
                        })}
                    </div>

                    <span className="w-5 text-center text-xs font-bold text-[#888888]">{row}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Screen Indicator (BookMyShow "All eyes this way please") */}
          <div className="mt-16 text-center max-w-md mx-auto">
            <div className="w-full h-1 bg-[#DDDDDD] rounded-full mx-auto" />
            <p className="text-[11px] font-bold text-[#888888] uppercase tracking-wider mt-2">
              All eyes this way please! (Screen)
            </p>
          </div>

          {/* Seat Legend */}
          <div className="mt-10 pt-6 border-t border-[#F0F0F0] flex flex-wrap items-center justify-center gap-6 text-xs text-[#555555]">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-sm bg-white border border-[#1EA83C]" />
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-sm bg-[#1EA83C] border border-[#1EA83C]" />
              <span className="font-semibold text-[#222222]">Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-sm bg-[#EEEEEE] border border-[#DDDDDD]" />
              <span>Sold</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-sm bg-white border border-[#8B5CF6]" />
              <span>Premium (Recliner)</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Bottom Sticky Checkout Bar (BookMyShow Standard) */}
      {selectedSeatIds.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-[#E5E5E5] py-3.5 z-40 shadow-bms-dropdown animate-fade-in">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#666666]">
                Seats: <span className="font-bold text-[#222222]">{selectedSeats.map((s) => `${s.row}${s.number}`).join(', ')}</span>
              </p>
              <p className="text-lg font-black text-[#222222]">
                Rs. {subtotal.toFixed(2)}
              </p>
            </div>

            <button
              onClick={handleProceedToReserve}
              disabled={reserving}
              className="px-8 py-2.5 bg-[#F84464] hover:bg-[#E03756] text-white font-bold rounded text-xs transition shadow-sm disabled:opacity-50 flex items-center space-x-2"
            >
              <span>{reserving ? 'Reserving...' : `Pay Rs. ${subtotal.toFixed(2)}`}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
