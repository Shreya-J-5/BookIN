import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { graphqlRequest } from '../services/graphqlClient';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, ShieldCheck, Armchair, ChevronRight, AlertCircle } from 'lucide-react';

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

          // If the seat was in our local selection and got locked/booked by someone else, unselect it
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

  // Sort rows alphabetically
  const sortedRows = Object.values(rowsMap).sort((a, b) => a.row.localeCompare(b.row));

  // Handle seat click
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

  // Calculate pricing breakdown
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

      // Broadcast seat locked via WebSocket
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

      // Navigate to checkout with reservation ID
      navigate(`/checkout/${reservation.reservationId}`, {
        state: {
          reservation,
          show
        }
      });
    } catch (err) {
      setErrorMsg(err.message || 'Seat reservation failed. Please choose other seats.');
      // Refresh seat inventory
      const refreshQuery = `query { showSeats(showId: "${showId}") { id seatId row number tier price status isAccessible } }`;
      graphqlRequest(refreshQuery).then((res) => setShowSeats(res.showSeats || []));
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-32 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm font-medium">Loading interactive seat layout...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen py-32 text-center text-white">
        <h2 className="text-2xl font-bold">Show Not Found</h2>
        <Link to="/" className="text-rose-500 underline text-sm mt-2 inline-block">
          Return to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Top Header Bar */}
      <div className="bg-[#161922] border-b border-[#242938] py-4 sticky top-16 sm:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-[#0c0e14] border border-[#242938] text-slate-300 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                <span>{show.movie.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-600 font-bold">
                  {show.movie.certification}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {show.screen.theatre.name} • {show.screen.name} ({show.screen.screenType})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0c0e14] border border-[#242938] text-xs">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-slate-300 font-medium">{wsConnected ? 'Live Sync Active' : 'Connecting Sync...'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Seat Layout Canvas */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Error notification */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 py-4 bg-[#161922]/60 border border-[#242938] rounded-2xl mb-10 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-[#0c0e14] border border-[#374151]" />
            <span className="text-slate-300">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-emerald-500 shadow-md shadow-emerald-900/50" />
            <span className="text-white font-semibold">Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-amber-500/80 border border-amber-600" />
            <span className="text-slate-400">Locked (Pending)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-rose-900/80 border border-rose-800" />
            <span className="text-slate-500">Booked</span>
          </div>
        </div>

        {/* Curved Screen Element */}
        <div className="relative w-full max-w-xl mx-auto mb-16 text-center">
          <div className="w-full h-3 rounded-full bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_15px_30px_-5px_rgba(225,29,72,0.4)]" />
          <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mt-4">
            SCREEN THIS WAY
          </p>
        </div>

        {/* Seat Grid By Tier */}
        <div className="space-y-8">
          {sortedRows.map(({ row, tier, price, seats }) => (
            <div key={row} className="flex flex-col items-center">
              {/* Tier & Price Label */}
              <div className="w-full flex items-center justify-between text-xs text-slate-400 font-semibold pb-2 border-b border-[#242938]/60 mb-3 px-4">
                <span className="text-white tracking-wide">
                  Row {row} — <span className="text-rose-400 font-bold">{tier}</span>
                </span>
                <span className="text-slate-300">₹{price}</span>
              </div>

              {/* Seats Row */}
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 overflow-x-auto w-full py-1">
                <span className="w-6 text-center text-xs font-bold text-slate-500">{row}</span>

                {seats
                  .sort((a, b) => a.number - b.number)
                  .map((seat) => {
                    const isSelected = selectedSeatIds.includes(seat.seatId);
                    const isAvailable = seat.status === 'AVAILABLE';
                    const isLocked = seat.status === 'LOCKED';
                    const isBooked = seat.status === 'BOOKED';

                    let seatClasses = 'bg-[#0c0e14] border border-[#374151] text-slate-300 hover:border-emerald-400 hover:scale-110';
                    if (isSelected) {
                      seatClasses = 'bg-emerald-500 border-emerald-400 text-white font-bold shadow-lg shadow-emerald-900/50 scale-105';
                    } else if (isLocked) {
                      seatClasses = 'bg-amber-500/20 border-amber-500/50 text-amber-400 cursor-not-allowed';
                    } else if (isBooked) {
                      seatClasses = 'bg-rose-950/40 border-rose-900/50 text-slate-600 cursor-not-allowed';
                    }

                    return (
                      <button
                        key={seat.id}
                        disabled={!isAvailable}
                        onClick={() => toggleSeatSelection(seat)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold transition-all ${seatClasses}`}
                        title={`Seat ${row}${seat.number} (${tier} - ₹${price})`}
                      >
                        {seat.number}
                      </button>
                    );
                  })}

                <span className="w-6 text-center text-xs font-bold text-slate-500">{row}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Bottom Checkout Bar */}
      {selectedSeatIds.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-[#161922]/95 backdrop-blur-md border-t border-[#242938] py-4 z-40 animate-slide-up shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400">
                Selected {selectedSeatIds.length} {selectedSeatIds.length === 1 ? 'Seat' : 'Seats'}
              </p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">₹{subtotal.toFixed(2)}</span>
                <span className="text-xs text-slate-400">
                  ({selectedSeats.map((s) => `${s.row}${s.number}`).join(', ')})
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToReserve}
              disabled={reserving}
              className="px-8 py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-rose-900/40 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{reserving ? 'Locking Seats...' : 'Proceed to Checkout'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
