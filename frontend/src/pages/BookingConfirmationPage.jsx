import React, { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Ticket, Film, Calendar, MapPin, Printer, Home } from 'lucide-react';

export default function BookingConfirmationPage() {
  const { bookingRef } = useParams();
  const location = useLocation();
  const booking = location.state?.booking;

  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // non-fatal
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen pb-24 pt-8">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        
        {/* Success Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-950/40">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Your digital movie ticket has been issued. Enjoy the show!
          </p>
        </div>

        {/* Digital Ticket Card */}
        <div className="relative bg-[#161922] border border-[#242938] rounded-3xl overflow-hidden shadow-2xl text-white print:border-black print:text-black">
          
          {/* Card Top: Movie Details */}
          <div className="p-6 sm:p-8 border-b border-dashed border-[#2e3447]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600/20 border border-rose-600/40 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                  Confirmed E-Ticket
                </span>
                <h2 className="text-2xl font-black text-white mt-2">
                  {booking?.movieTitle || 'Blockbuster Movie'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {booking?.theatreName} • {booking?.screenName}
                </p>
                <p className="text-xs text-slate-400">
                  {booking?.theatreCity}
                </p>
              </div>

              {booking?.moviePosterUrl && (
                <img
                  src={booking.moviePosterUrl}
                  alt="Poster"
                  className="w-16 h-24 object-cover rounded-xl border border-[#242938] shadow-md flex-shrink-0"
                />
              )}
            </div>

            {/* Showtime & Seats Info */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#242938]/60 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Date & Time</span>
                <span className="font-bold text-white text-sm">
                  {booking?.startTime ? new Date(booking.startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Today'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Seats</span>
                <span className="font-bold text-rose-400 text-sm">
                  {booking?.seats?.map((s) => `${s.row}${s.number}`).join(', ') || 'Selected Seats'}
                </span>
              </div>
            </div>
          </div>

          {/* Perforation Cutouts */}
          <div className="relative flex items-center justify-between px-2 -my-3">
            <div className="w-6 h-6 rounded-full bg-[#0c0e14] border border-[#242938]" />
            <div className="flex-1 border-t-2 border-dashed border-[#242938] mx-2" />
            <div className="w-6 h-6 rounded-full bg-[#0c0e14] border border-[#242938]" />
          </div>

          {/* Card Bottom: QR Code & Booking Ref */}
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#11131b]">
            <div className="space-y-2 text-center sm:text-left">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Booking Reference</span>
                <p className="text-xl font-black tracking-widest text-white font-mono">{bookingRef}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Paid</span>
                <p className="text-lg font-black text-rose-500">₹{booking?.totalAmount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="p-3 bg-white rounded-2xl shadow-xl flex-shrink-0">
              <QRCodeSVG
                value={booking?.qrPayload || `BOOKIN|${bookingRef}`}
                size={110}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 print:hidden">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-6 py-3 bg-[#161922] hover:bg-slate-800 border border-[#242938] text-white font-semibold rounded-xl text-xs transition flex items-center justify-center space-x-2"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print E-Ticket</span>
          </button>

          <Link
            to="/my-bookings"
            className="w-full sm:w-auto px-6 py-3 bg-[#161922] hover:bg-slate-800 border border-[#242938] text-white font-semibold rounded-xl text-xs transition flex items-center justify-center space-x-2"
          >
            <Ticket className="w-4 h-4 text-rose-500" />
            <span>My Bookings</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-rose-900/30"
          >
            <Home className="w-4 h-4" />
            <span>Back to Movies</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
