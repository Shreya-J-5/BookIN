import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { graphqlRequest } from '../services/graphqlClient';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  Tag,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Ticket
} from 'lucide-react';

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
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 10-Minute Countdown
  useEffect(() => {
    if (!reservation?.expiresAt) return;

    const calculateRemaining = () => {
      const expiry = new Date(reservation.expiresAt).getTime();
      const now = new Date().getTime();
      return Math.max(0, Math.floor((expiry - now) / 1000));
    };

    setTimeLeft(calculateRemaining());

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        alert('Your 10-minute seat reservation has expired. Please select your seats again.');
        navigate('/');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [reservation, navigate]);

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

  const handlePayment = async () => {
    if (!paymentOrder) return;
    setProcessingPayment(true);
    setErrorMsg('');

    if (window.Razorpay && !paymentOrder.keyId.startsWith('rzp_test_bookin_mock')) {
      const options = {
        key: paymentOrder.keyId,
        amount: Math.round(paymentOrder.amount * 100),
        currency: paymentOrder.currency,
        name: 'BookIN Tickets',
        description: `Booking for ${show?.movie?.title || 'Movie'}`,
        order_id: paymentOrder.orderId,
        prefill: {
          name: user?.fullName || 'Customer',
          email: user?.email || 'customer@bookin.com',
          contact: user?.phone || '9876543210'
        },
        theme: {
          color: '#D5A936'
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
      // Sandbox Simulator fallback for test credentials
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
      <div className="min-h-screen py-32 text-center text-[#666666] bg-[#FFFFFF]">
        <div className="w-8 h-8 border-2 border-[#D5A936] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium">Securing payment order...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] min-h-screen pb-24 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1 text-xs text-[#666666] hover:text-[#202020] transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Seats</span>
        </button>

        {/* 10-Minute Lock Timer Bar */}
        <div className="bg-[#FBF6EA] border border-[#E2C36E] rounded-sm p-3 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-[#D5A936] animate-pulse flex-shrink-0" />
            <p className="text-xs text-[#202020] font-medium">
              Seats locked for you. Complete payment before the timer expires.
            </p>
          </div>
          <span className="font-mono font-bold text-xs text-[#202020] bg-white px-2 py-0.5 rounded-sm border border-[#E2C36E]">
            {timeFormatted}
          </span>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-sm text-red-600 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Order Summary & Coupon */}
          <div className="md:col-span-2 space-y-4">
            
            {/* Ticket Summary Box */}
            <div className="bg-white border border-[#DADADA] rounded-sm p-5 shadow-subtle space-y-3">
              <h2 className="text-sm font-bold text-[#202020] uppercase tracking-wider pb-2 border-b border-[#F5F5F5] flex items-center space-x-1.5">
                <Ticket className="w-4 h-4 text-[#D5A936]" />
                <span>Ticket Summary</span>
              </h2>

              <div>
                <h3 className="text-base font-bold text-[#202020]">
                  {show?.movie?.title || 'Selected Movie'}
                </h3>
                <p className="text-xs text-[#666666] mt-0.5">
                  {show?.screen?.theatre?.name} — {show?.screen?.name}
                </p>
                <p className="text-xs text-[#666666] mt-0.5">
                  {show?.startTime ? new Date(show.startTime).toLocaleString('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Showtime'}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F5F5F5] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#666666]">Selected Seats: </span>
                  <span className="font-bold text-[#202020]">
                    {reservation?.seatLabels?.join(', ') || 'Seats Reserved'}
                  </span>
                  <span className="text-[#888888] ml-1">
                    ({reservation?.reservedSeatsCount || 1} Tickets)
                  </span>
                </div>
              </div>
            </div>

            {/* Promo Code Box */}
            <div className="bg-white border border-[#DADADA] rounded-sm p-5 shadow-subtle">
              <h3 className="text-xs font-bold text-[#202020] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-[#D5A936]" />
                <span>Apply Promotional Coupon</span>
              </h3>
              
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter code e.g. WELCOME50"
                  className="flex-1 px-3 py-2 bg-white border border-[#DADADA] rounded-sm text-xs text-[#202020] uppercase tracking-wider focus:outline-none focus:border-[#D5A936]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-white border border-[#DADADA] hover:border-[#D5A936] text-[#202020] hover:text-[#D5A936] text-xs font-bold rounded-sm transition"
                >
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <p className="text-xs text-emerald-700 mt-2 font-medium flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Coupon '{appliedCoupon}' applied successfully!
                </p>
              )}

              {couponError && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  {couponError}
                </p>
              )}
            </div>

            {/* Trust Assurance Badge */}
            <div className="p-3.5 bg-[#F5F5F5] border border-[#DADADA] rounded-sm flex items-center space-x-3 text-xs text-[#555555]">
              <ShieldCheck className="w-5 h-5 text-[#D5A936] flex-shrink-0" />
              <span>Safe & Secure 256-bit encrypted transaction with instant ticket delivery.</span>
            </div>

          </div>

          {/* Right Col: Price Breakdown & Payment CTA */}
          <div className="space-y-4">
            <div className="bg-white border border-[#DADADA] rounded-sm p-5 shadow-subtle space-y-3.5">
              <h3 className="text-xs font-bold text-[#202020] uppercase tracking-wider pb-2 border-b border-[#F5F5F5]">
                Payment Breakdown
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#555555]">
                  <span>Tickets Subtotal</span>
                  <span>₹{paymentOrder?.subtotal?.toFixed(2) || '0.00'}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount Savings</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#555555]">
                  <span>Convenience Fee (incl. GST)</span>
                  <span>₹{((paymentOrder?.convenienceFee || 0) + (paymentOrder?.taxAmount || 0)).toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-[#DADADA] flex justify-between items-center text-sm font-black text-[#202020]">
                  <span>Total Amount</span>
                  <span className="text-lg">₹{paymentOrder?.amount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              {/* Gold Payment Button */}
              <button
                onClick={handlePayment}
                disabled={processingPayment}
                className="w-full mt-2 py-3 bg-[#D5A936] hover:bg-[#C2982B] text-[#1A1A1A] font-bold rounded-sm text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {processingPayment
                    ? 'Processing...'
                    : `Pay ₹${paymentOrder?.amount?.toFixed(2) || '0.00'}`}
                </span>
              </button>

              <p className="text-[10px] text-[#888888] text-center pt-1">
                By clicking pay, you agree to BookIN terms & cancellation policy.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
