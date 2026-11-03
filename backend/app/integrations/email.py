import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings


class EmailService:
    @staticmethod
    def send_ticket_confirmation(
        to_email: str,
        user_name: str,
        booking_ref: str,
        movie_title: str,
        theatre_name: str,
        screen_name: str,
        show_time: str,
        seats_str: str,
        total_amount: float
    ) -> bool:
        """
        Sends confirmed movie ticket email with cinema details.
        Falls back cleanly to logging if SMTP credentials are unconfigured.
        """
        html_content = f"""
        <div style="font-family: Arial, sans-serif; background-color: #0c0e14; color: #ffffff; padding: 24px; border-radius: 8px;">
            <h1 style="color: #e11d48; margin-bottom: 8px;">🎬 BookIN Booking Confirmed!</h1>
            <p style="color: #9ca3af; font-size: 16px;">Hello {user_name}, your movie tickets are ready.</p>
            <div style="background-color: #161922; border: 1px solid #242938; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h2 style="color: #ffffff; margin-top: 0;">{movie_title}</h2>
                <p><strong>Booking Ref:</strong> <span style="color: #e11d48; font-weight: bold;">{booking_ref}</span></p>
                <p><strong>Theatre:</strong> {theatre_name} ({screen_name})</p>
                <p><strong>Showtime:</strong> {show_time}</p>
                <p><strong>Seats:</strong> {seats_str}</p>
                <p><strong>Total Paid:</strong> ₹{total_amount:.2f}</p>
            </div>
            <p style="color: #6b7280; font-size: 13px;">Please show this confirmation or the QR ticket in the BookIN app at the cinema entrance.</p>
        </div>
        """

        if not settings.EMAIL_HOST or not settings.EMAIL_USERNAME or not settings.EMAIL_PASSWORD:
            # SMTP not configured, simulate success
            print(f"[BookIN Email Service] Mock dispatch to {to_email}: Booking {booking_ref} for '{movie_title}'")
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"🎟️ Your BookIN Ticket: {movie_title} [{booking_ref}]"
            msg["From"] = settings.EMAIL_FROM
            msg["To"] = to_email

            part = MIMEText(html_content, "html")
            msg.attach(part)

            with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
                server.starttls()
                server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
                server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
            return True
        except Exception as e:
            print(f"[BookIN Email Service] Error sending email: {e}")
            return False


email_service = EmailService()
