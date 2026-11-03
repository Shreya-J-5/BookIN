import React, { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Ticket, Printer, Home, MapPin, Calendar, Clock } from 'lucide-react';
import { BookinLogo } from '../components/BookinLogo';

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
    <div className="bg-[#F8F9FA] min-h-screen pb-24 pt-10">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        
        {/* Success Alert Banner */}
        <div className="bg-[#FEF9EE] border border-[#F2D38A] rounded-xl p-5 mb-6 text-center space-y-1 shadow-subtle">
          <CheckCircle2 className="w-8 h-8 text-[#E5B642] mx-auto" />
          <h1 className="text-base font-bold text-[#1E232A]">Booking Confirmed!</h1>
          <p className="text-xs text-[#64748B]">
            Your digital movie ticket has been confirmed and sent to your email.
          </p>
        </div>

        {/* M-Ticket Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-card overflow-hidden print:border-black">
          
          {/* Ticket Header */}
          <div className="p-6 border-b border-[#F1F5F9]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#1E232A] uppercase tracking-wider bg-[#FEF9EE] border border-[#F2D38A] px-2.5 py-0.5 rounded-full">
                  Confirmed E-Ticket
                </span>
                <h2 className="text-xl font-black text-[#1E232A] mt-2">
                  {booking?.movieTitle || 'Blockbuster Screening'}
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {booking?.theatreName} ({booking?.theatreCity})
                </p>
                <p className="text-xs text-[#94A3B8]">
                  {booking?.screenName}
                </p>
              </div>

              {booking?.moviePosterUrl && (
                <img
                  src={booking.moviePosterUrl}
                  alt="Poster"
                  className="w-16 h-24 object-cover rounded-lg border border-[#E2E8F0] shadow-xs flex-shrink-0"
                />
              )}
            </div>

            {/* Time & Seats Grid */}
            <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-[#F1F5F9] text-xs">
              <div>
                <span className="text-[#94A3B8] font-medium block">Showtime</span>
                <span className="font-bold text-[#1E232A]">
                  {booking?.startTime ? new Date(booking.startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Today'}
                </span>
              </div>

              <div>
                <span className="text-[#94A3B8] font-medium block">Seats</span>
                <span className="font-bold text-[#E5B642] text-sm">
                  {booking?.seats?.map((s) => `${s.row}${s.number}`).join(', ') || 'Seats'}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Footer with QR Code & Booking Ref */}
          <div className="p-6 bg-[#F8F9FA] border-t border-dashed border-[#E2E8F0] flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div>
                <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Booking ID</span>
                <p className="text-lg font-black text-[#1E232A] font-mono tracking-wider">{bookingRef}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Total Paid</span>
                <p className="text-base font-bold text-[#1E232A]">₹{booking?.totalAmount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            {/* Scannable M-Ticket QR Code */}
            <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] shadow-xs flex flex-col items-center flex-shrink-0">
              <QRCodeSVG
                value={booking?.qrPayload || `BOOKIN-${bookingRef}`}
                size={88}
                level="M"
              />
              <span className="text-[9px] text-[#94A3B8] mt-1 font-semibold uppercase tracking-wider">
                Scan at gate
              </span>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-white border border-[#E2E8F0] hover:border-[#E5B642] text-[#1E232A] text-xs font-semibold rounded-full transition flex items-center justify-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Ticket</span>
          </button>
          
          <Link
            to="/"
            className="flex-1 py-2.5 bg-[#E5B642] hover:bg-[#D4A333] text-[#1E232A] text-xs font-bold rounded-full transition flex items-center justify-center space-x-2 text-center shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
