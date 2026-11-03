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
          color: '#F84464'
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
      <div className="min-h-screen py-32 text-center text-[#888888] bg-[#F5F5F5]">
        <div className="w-8 h-8 border-2 border-[#F84464] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium">Securing payment order...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-24 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1 text-xs text-[#666666] hover:text-[#222222] transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Seats</span>
        </button>

        {/* 10-Minute Lock Timer Bar */}
        <div className="bg-[#FFF8E6] border border-[#FFE8A3] rounded-lg p-3 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse flex-shrink-0" />
            <p className="text-xs text-[#665200]">
              Seats locked for you. Complete payment before the timer expires.
            </p>
          </div>
          <span className="font-mono font-bold text-xs text-amber-800 bg-white px-2 py-0.5 rounded border border-[#FFE8A3]">
            {timeFormatted}
          </span>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-[#FFF1F3] border border-[#F84464]/30 rounded text-[#F84464] text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Order Summary & Coupon */}
          <div className="md:col-span-2 space-y-4">
            
            {/* Ticket Summary Box */}
            <div className="bg-white border border-[#E5E5E5] rounded-lg p-5 shadow-bms space-y-3">
              <h2 className="text-sm font-bold text-[#222222] uppercase tracking-wider pb-2 border-b border-[#F0F0F0] flex items-center space-x-1.5">
                <Ticket className="w-4 h-4 text-[#F84464]" />
                <span>Ticket Summary</span>
              </h2>

              <div>
                <h3 className="text-base font-bold text-[#222222]">
                  {show?.movie?.title || 'Selected Movie'}
                </h3>
                <p className="text-xs text-[#666666] mt-0.5">
                  {show?.screen?.theatre?.name} • {show?.screen?.name} ({show?.screen?.screenType})
                </p>
                <p className="text-xs text-[#666666]">
                  {show?.startTime ? new Date(show.startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Today'}
                </p>
              </div>

              {/* Reserved Seats List */}
              <div className="pt-2 border-t border-[#F0F0F0]">
                <span className="text-xs text-[#777777]">Selected Seats:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {reservation?.seatLabels?.map((label) => (
                    <span
                      key={label}
                      className="px-2 py-0.5 rounded bg-[#F5F5F5] border border-[#E5E5E5] text-[#222222] font-bold text-xs"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Offers & Coupons Box */}
            <div className="bg-white border border-[#E5E5E5] rounded-lg p-5 shadow-bms space-y-3">
              <h3 className="text-xs font-bold text-[#222222] uppercase tracking-wider flex items-center space-x-1.5">
                <Tag className="w-4 h-4 text-[#1EA83C]" />
                <span>Offers & Promo Codes</span>
              </h3>

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter Promo Code (e.g. WELCOME100, BOOKIN50)"
                  className="flex-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#F84464] font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#222222] hover:bg-[#333333] text-white text-xs font-bold rounded transition"
                >
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <div className="flex items-center space-x-1.5 text-xs text-[#1EA83C] font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Promo '{appliedCoupon}' applied: Saved Rs. {discountAmount.toFixed(2)}</span>
                </div>
              )}

              {couponError && (
                <p className="text-xs text-[#F84464]">{couponError}</p>
              )}
            </div>

          </div>

          {/* Right 1 Col: Booking Summary & Payment CTA */}
          <div>
            <div className="bg-white border border-[#E5E5E5] rounded-lg p-5 shadow-bms space-y-3 sticky top-28">
              <h3 className="text-xs font-bold text-[#222222] uppercase tracking-wider pb-2 border-b border-[#F0F0F0]">
                Payment Breakdown
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#555555]">
                  <span>Ticket Price</span>
                  <span className="font-semibold text-[#222222]">Rs. {paymentOrder?.subtotal?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-[#666666]">
                  <span>Convenience Fees</span>
                  <span>Rs. {paymentOrder?.convenienceFee?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-[#666666]">
                  <span>Integrated GST (18%)</span>
                  <span>Rs. {paymentOrder?.taxAmount?.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#1EA83C] font-semibold">
                    <span>Promo Discount</span>
                    <span>-Rs. {discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#E5E5E5] flex justify-between items-baseline font-bold text-[#222222]">
                  <span className="text-sm">Amount Payable</span>
                  <span className="text-lg text-[#F84464] font-black">
                    Rs. {paymentOrder?.amount?.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={processingPayment}
                className="w-full py-3 bg-[#F84464] hover:bg-[#E03756] text-white font-bold rounded text-xs transition shadow-sm disabled:opacity-50 mt-2 flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {processingPayment
                    ? 'Processing...'
                    : `Proceed to Pay Rs. ${paymentOrder?.amount?.toFixed(2)}`}
                </span>
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[10px] text-[#888888] pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1EA83C]" />
                <span>Safe and Secure Payments via Razorpay</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
