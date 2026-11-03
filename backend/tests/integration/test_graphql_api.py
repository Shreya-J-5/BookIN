import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "BookIN"


def test_graphql_movies_query():
    query = """
    query {
        movies {
            id
            title
            slug
            language
            durationMinutes
            genres {
                name
            }
        }
    }
    """
    response = client.post("/graphql", json={"query": query})
    assert response.status_code == 200
    res_data = response.json()
    assert "data" in res_data
    movies = res_data["data"]["movies"]
    assert len(movies) > 0
    assert any(m["slug"] == "dune-part-two" for m in movies)


def test_graphql_theatres_and_shows_query():
    query = """
    query {
        theatres(city: "Mumbai") {
            id
            name
            city
            screens {
                name
                totalSeats
            }
        }
        shows(city: "Mumbai") {
            id
            startTime
            theatreName
            movie {
                title
            }
        }
    }
    """
    response = client.post("/graphql", json={"query": query})
    assert response.status_code == 200
    res_data = response.json()
    assert "data" in res_data
    assert len(res_data["data"]["theatres"]) > 0
    assert len(res_data["data"]["shows"]) > 0


def test_graphql_user_registration_and_login():
    import uuid
    test_email = f"cine_{uuid.uuid4().hex[:6]}@example.com"

    reg_mutation = f"""
    mutation {{
        register(input: {{
            email: "{test_email}",
            password: "Password123!",
            fullName: "Test User"
        }}) {{
            user {{
                email
                fullName
            }}
            accessToken
        }}
    }}
    """
    res = client.post("/graphql", json={"query": reg_mutation})
    assert res.status_code == 200
    data = res.json()["data"]["register"]
    assert data["user"]["email"] == test_email
    assert data["accessToken"] != ""

    # Login
    login_mutation = f"""
    mutation {{
        login(input: {{
            email: "{test_email}",
            password: "Password123!"
        }}) {{
            user {{
                email
            }}
            accessToken
        }}
    }}
    """
    res2 = client.post("/graphql", json={"query": login_mutation})
    assert res2.status_code == 200
    data2 = res2.json()["data"]["login"]
    assert data2["user"]["email"] == test_email
    assert data2["accessToken"] != ""


def test_end_to_end_booking_and_payment_flow():
    import uuid

    # 1. Register a user
    user_email = f"booker_{uuid.uuid4().hex[:6]}@example.com"
    reg_mutation = f"""
    mutation {{
        register(input: {{
            email: "{user_email}",
            password: "Password123!",
            fullName: "Movie Buff"
        }}) {{
            user {{ id email }}
            accessToken
        }}
    }}
    """
    res = client.post("/graphql", json={"query": reg_mutation})
    assert res.status_code == 200
    token = res.json()["data"]["register"]["accessToken"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. Query available shows and find an upcoming show with available seats
    shows_query = """
    query {
        shows(city: "Mumbai") {
            id
            startTime
        }
    }
    """
    res = client.post("/graphql", json={"query": shows_query})
    shows = res.json()["data"]["shows"]
    assert len(shows) > 0
    from datetime import datetime, timezone
    now_utc = datetime.now(timezone.utc)
    def parse_show_dt(val: str) -> datetime:
        dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
        return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)

    future_shows = [
        s for s in shows
        if (parse_show_dt(s["startTime"]) - now_utc).total_seconds() > 3 * 3600
    ]
    show_id = future_shows[0]["id"] if future_shows else shows[-1]["id"]

    # 3. Query show seats
    seats_query = f"""
    query {{
        showSeats(showId: "{show_id}") {{
            id
            seatId
            row
            number
            status
            price
        }}
    }}
    """
    res = client.post("/graphql", json={"query": seats_query})
    show_seats = res.json()["data"]["showSeats"]
    available_seats = [s for s in show_seats if s["status"] == "AVAILABLE"]
    assert len(available_seats) >= 2

    chosen_seat_ids = [available_seats[0]["seatId"], available_seats[1]["seatId"]]

    # 4. Reserve seats
    reserve_mutation = f"""
    mutation {{
        reserveSeats(
            showId: "{show_id}",
            seatIds: ["{chosen_seat_ids[0]}", "{chosen_seat_ids[1]}"]
        ) {{
            reservationId
            reservedSeatsCount
            totalPrice
            status
        }}
    }}
    """
    res = client.post("/graphql", json={"query": reserve_mutation}, headers=auth_headers)
    assert res.status_code == 200
    res_data = res.json()
    assert "data" in res_data
    reservation = res_data["data"]["reserveSeats"]
    assert reservation["reservedSeatsCount"] == 2
    reservation_id = reservation["reservationId"]

    # 5. Create Payment Order with Coupon
    order_mutation = f"""
    mutation {{
        createPaymentOrder(
            reservationId: "{reservation_id}",
            couponCode: "WELCOME100"
        ) {{
            paymentId
            orderId
            amount
            subtotal
            discountAmount
        }}
    }}
    """
    res = client.post("/graphql", json={"query": order_mutation}, headers=auth_headers)
    assert res.status_code == 200
    order_res = res.json()["data"]["createPaymentOrder"]
    assert order_res["orderId"] != ""
    assert order_res["discountAmount"] > 0
    razorpay_order_id = order_res["orderId"]

    # 6. Verify Payment & Confirm Booking
    mock_payment_id = f"pay_{uuid.uuid4().hex[:10]}"
    mock_signature = f"mock_sig_{uuid.uuid4().hex[:10]}"
    confirm_mutation = f"""
    mutation {{
        verifyPaymentAndBook(input: {{
            reservationId: "{reservation_id}",
            razorpayOrderId: "{razorpay_order_id}",
            razorpayPaymentId: "{mock_payment_id}",
            razorpaySignature: "{mock_signature}"
        }}) {{
            id
            bookingRef
            status
            totalAmount
            seats {{
                row
                number
            }}
        }}
    }}
    """
    res = client.post("/graphql", json={"query": confirm_mutation}, headers=auth_headers)
    assert res.status_code == 200
    booking_res = res.json()["data"]["verifyPaymentAndBook"]
    assert booking_res["status"] == "CONFIRMED"
    assert booking_res["bookingRef"].startswith("BIN-")
    booking_id = booking_res["id"]

    # 7. Query myBookings
    my_bookings_query = """
    query {
        myBookings {
            id
            bookingRef
            status
        }
    }
    """
    res = client.post("/graphql", json={"query": my_bookings_query}, headers=auth_headers)
    assert res.status_code == 200
    bookings_list = res.json()["data"]["myBookings"]
    assert any(b["id"] == booking_id for b in bookings_list)

    # 8. Verify the seats are now BOOKED and cannot be reserved by another customer
    another_user_email = f"booker2_{uuid.uuid4().hex[:6]}@example.com"
    reg2_mutation = f"""
    mutation {{
        register(input: {{
            email: "{another_user_email}",
            password: "Password123!",
            fullName: "Another User"
        }}) {{
            accessToken
        }}
    }}
    """
    res = client.post("/graphql", json={"query": reg2_mutation})
    user2_token = res.json()["data"]["register"]["accessToken"]
    res = client.post(
        "/graphql",
        json={"query": reserve_mutation},
        headers={"Authorization": f"Bearer {user2_token}"}
    )
    assert res.status_code == 200
    assert "errors" in res.json()
    assert "already booked" in res.json()["errors"][0]["message"]

    # 9. Cancel booking and verify refund and seats restored to AVAILABLE
    cancel_mutation = f"""
    mutation {{
        cancelBooking(bookingId: "{booking_id}") {{
            success
            message
            refundAmount
        }}
    }}
    """
    res = client.post("/graphql", json={"query": cancel_mutation}, headers=auth_headers)
    assert res.status_code == 200
    cancel_res = res.json()["data"]["cancelBooking"]
    assert cancel_res["success"] is True
    assert cancel_res["refundAmount"] > 0

    # 10. Verify seats are back to AVAILABLE
    res = client.post("/graphql", json={"query": seats_query})
    refreshed_seats = res.json()["data"]["showSeats"]
    assert any(s["seatId"] == chosen_seat_ids[0] and s["status"] == "AVAILABLE" for s in refreshed_seats)


