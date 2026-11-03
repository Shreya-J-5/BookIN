import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { graphqlRequest } from '../services/graphqlClient';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, ShieldCheck, Ticket, Tag, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CheckoutPage() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [reservation, setReservation] = useState(location.state?.reservation || null);
  const [show, setShow] = useState(location.state?.show || null);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');

  const [paymentOrder, setPaymentOrder] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins in seconds
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 10-Minute Countdown Timer
  useEffect(() => {
    if (!reservation?.expiresAt) return;

    const calculateRemaining = () => {
      const expiry = new Date(reservation.expiresAt).getTime();
      const now = new Date().getTime();
      const diffSeconds = Math.max(0, Math.floor((expiry - now) / 1000));
      return diffSeconds;
    };

    setTimeLeft(calculateRemaining());

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        alert('Your 10-minute reservation has expired. The seats have been released.');
        navigate('/');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [reservation, navigate]);

  // Create or update payment order
  const initPaymentOrder = async (code = null) => {
    setErrorMsg('');
    try {
      const mutation = `
        mutation CreatePaymentOrder($reservationId: UUID!, $couponCode: String) {
          createPaymentOrder(reservationId: $reservationId, couponCode: $couponCode) {
            paymentId
            orderId
            amount
            currency
            keyId
            subtotal
            discountAmount
            convenienceFee
            taxAmount
          }
        }
      `;
      const data = await graphqlRequest(mutation, {
        reservationId,
        couponCode: code
      });
      setPaymentOrder(data.createPaymentOrder);
      setDiscountAmount(data.createPaymentOrder.discountAmount);
      if (code) {
        setAppliedCoupon(code);
        setCouponError('');
      }
    } catch (err) {
      if (code) {
        setCouponError(err.message);
      } else {
        setErrorMsg(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initPaymentOrder();
  }, [reservationId]);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    initPaymentOrder(couponCode.trim());
  };

  // Payment Execution & Verification
  const handlePayment = async () => {
    if (!paymentOrder) return;
    setProcessingPayment(true);
    setErrorMsg('');

    // Check if live Razorpay SDK is available
    if (window.Razorpay && !paymentOrder.keyId.startsWith('rzp_test_bookin_mock')) {
      const options = {
        key: paymentOrder.keyId,
        amount: Math.round(paymentOrder.amount * 100),
        currency: paymentOrder.currency,
        name: 'BookIN Tickets',
        description: `Booking for ${show?.movie?.title || 'Movie'}`,
        order_id: paymentOrder.orderId,
        prefill: {
          name: user?.fullName || 'Movie Enthusiast',
          email: user?.email || 'customer@bookin.com',
          contact: user?.phone || '9876543210'
        },
        theme: {
          color: '#e11d48'
        },
        handler: async function (response) {
          await verifyAndFinalize(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      // Mock Sandbox Simulator for test credentials
      // Simulate real HMAC signature verification flow
      const mockPaymentId = `pay_${Date.now()}`;
      const mockSignature = `mock_sig_${Date.now()}`;

      await verifyAndFinalize(paymentOrder.orderId, mockPaymentId, mockSignature);
    }
  };

  const verifyAndFinalize = async (orderId, paymentId, signature) => {
    try {
      const mutation = `
        mutation VerifyPaymentAndBook($input: PaymentConfirmationInput!) {
          verifyPaymentAndBook(input: $input) {
            id
            bookingRef
            totalAmount
            discountAmount
            convenienceFee
            taxAmount
            status
            qrPayload
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
      const data = await graphqlRequest(mutation, {
        input: {
          reservationId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature
        }
      });

      const confirmedBooking = data.verifyPaymentAndBook;
      navigate(`/confirmation/${confirmedBooking.bookingRef}`, {
        state: { booking: confirmedBooking }
      });
    } catch (err) {
      setErrorMsg(err.message || 'Payment confirmation failed.');
      setProcessingPayment(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  if (loading) {
    return (
      <div className="min-h-screen py-32 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm font-medium">Securing checkout gateway...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Seats</span>
        </button>

        {/* 10-Minute Lock Timer Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Seats Temporarily Reserved</h3>
              <p className="text-xs text-slate-400">Complete payment before timer expires to guarantee your booking.</p>
            </div>
          </div>

          <div className="text-center sm:text-right px-4 py-2 bg-[#0c0e14] rounded-xl border border-amber-500/30">
            <span className="text-lg font-black text-amber-400 font-mono tracking-widest">{timeFormatted}</span>
            <span className="block text-[10px] text-slate-500 uppercase font-semibold">Remaining</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Order Summary & Coupon */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Booking Details Card */}
            <div className="bg-[#161922] border border-[#242938] rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2 pb-3 border-b border-[#242938]">
                <Ticket className="w-5 h-5 text-rose-500" />
                <span>Ticket Details</span>
              </h2>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-white">{show?.movie?.title || 'Movie Experience'}</h3>
                <p className="text-xs text-slate-400">
                  {show?.screen?.theatre?.name} • {show?.screen?.name}
                </p>
                <p className="text-xs text-slate-400">
                  {show?.startTime ? new Date(show.startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Today'}
                </p>
              </div>

              {/* Reserved Seat Badges */}
              <div className="pt-3 border-t border-[#242938]">
                <span className="text-xs text-slate-400 font-medium">Reserved Seats:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {reservation?.seatLabels?.map((label) => (
                    <span
                      key={label}
                      className="px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 font-bold text-xs"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="bg-[#161922] border border-[#242938] rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>Offers & Coupons</span>
              </h3>

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter code (e.g. WELCOME100, BOOKIN50)"
                  className="flex-1 px-4 py-2 bg-[#0c0e14] border border-[#242938] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 uppercase font-mono"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#242938] hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition"
                >
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Coupon '{appliedCoupon}' applied successfully! Saved ₹{discountAmount}</span>
                </div>
              )}

              {couponError && (
                <p className="text-xs text-rose-400 font-medium">{couponError}</p>
              )}
            </div>

          </div>

          {/* Right Col: Price Breakdown & Payment CTA */}
          <div className="space-y-6">
            <div className="bg-[#161922] border border-[#242938] rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white pb-3 border-b border-[#242938]">
                Payment Breakdown
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Ticket Subtotal</span>
                  <span className="font-semibold text-white">₹{paymentOrder?.subtotal?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Convenience Fee</span>
                  <span>₹{paymentOrder?.convenienceFee?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Integrated GST (18%)</span>
                  <span>₹{paymentOrder?.taxAmount?.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#242938] flex justify-between items-baseline text-sm font-bold text-white">
                  <span>Total Amount</span>
                  <span className="text-xl font-black text-rose-500">
                    ₹{paymentOrder?.amount?.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={processingPayment}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-rose-900/40 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {processingPayment
                    ? 'Processing Payment...'
                    : `Pay ₹${paymentOrder?.amount?.toFixed(2)} via Razorpay`}
                </span>
              </button>

              <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>256-Bit Encrypted Razorpay Checkout</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
