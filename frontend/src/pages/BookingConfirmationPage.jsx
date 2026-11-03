import React, { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Ticket, Printer, Home, MapPin, Calendar, Clock } from 'lucide-react';

export default function BookingConfirmationPage() {
  const { bookingRef } = useParams();
  const location = useLocation();
  const booking = location.state?.booking;

  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
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
    <div className="bg-[#F5F5F5] min-h-screen pb-24 pt-8">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        
        {/* Success Alert Banner */}
        <div className="bg-[#EAFBF0] border border-[#BDEECF] rounded-lg p-4 mb-6 text-center space-y-1">
          <CheckCircle2 className="w-8 h-8 text-[#1EA83C] mx-auto" />
          <h1 className="text-base font-bold text-[#116928]">Booking Confirmed!</h1>
          <p className="text-xs text-[#2A7B40]">
            Your digital movie ticket has been confirmed and sent to your email.
          </p>
        </div>

        {/* M-Ticket Card (BookMyShow Clean Boxy Ticket) */}
        <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-bms overflow-hidden print:border-black">
          
          {/* Ticket Header */}
          <div className="p-6 border-b border-[#F0F0F0]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#F84464] uppercase tracking-wider bg-[#FFF1F3] px-2 py-0.5 rounded">
                  Confirmed E-Ticket
                </span>
                <h2 className="text-xl font-bold text-[#222222] mt-1.5">
                  {booking?.movieTitle || 'Blockbuster Screening'}
                </h2>
                <p className="text-xs text-[#666666] mt-0.5">
                  {booking?.theatreName} ({booking?.theatreCity})
                </p>
                <p className="text-xs text-[#888888]">
                  {booking?.screenName}
                </p>
              </div>

              {booking?.moviePosterUrl && (
                <img
                  src={booking.moviePosterUrl}
                  alt="Poster"
                  className="w-16 h-24 object-cover rounded border border-[#E5E5E5] shadow-xs flex-shrink-0"
                />
              )}
            </div>

            {/* Time & Seats Grid */}
            <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-[#F0F0F0] text-xs">
              <div>
                <span className="text-[#888888] font-medium block">Showtime</span>
                <span className="font-bold text-[#222222]">
                  {booking?.startTime ? new Date(booking.startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Today'}
                </span>
              </div>

              <div>
                <span className="text-[#888888] font-medium block">Seats</span>
                <span className="font-bold text-[#F84464] text-sm">
                  {booking?.seats?.map((s) => `${s.row}${s.number}`).join(', ') || 'Seats'}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Footer with QR Code & Booking Ref */}
          <div className="p-6 bg-[#FAFAFA] border-t border-dashed border-[#E5E5E5] flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div>
                <span className="text-[10px] text-[#888888] font-bold uppercase tracking-wider">Booking ID</span>
                <p className="text-lg font-black text-[#222222] font-mono tracking-wider">{bookingRef}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#888888] font-bold uppercase tracking-wider">Total Paid</span>
                <p className="text-base font-bold text-[#222222]">Rs. {booking?.totalAmount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="p-2.5 bg-white border border-[#E5E5E5] rounded shadow-xs flex-shrink-0">
              <QRCodeSVG
                value={booking?.qrPayload || `BOOKIN|${bookingRef}`}
                size={95}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 print:hidden">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-[#F9F9F9] border border-[#E5E5E5] text-[#222222] font-semibold rounded text-xs transition flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#666666]" />
            <span>Print Ticket</span>
          </button>

          <Link
            to="/my-bookings"
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-[#F9F9F9] border border-[#E5E5E5] text-[#222222] font-semibold rounded text-xs transition flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <Ticket className="w-4 h-4 text-[#F84464]" />
            <span>Your Orders</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-2.5 bg-[#F84464] hover:bg-[#E03756] text-white font-bold rounded text-xs transition flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Book Another Movie</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
