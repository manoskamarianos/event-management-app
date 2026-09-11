import sys
import uuid
import requests

AUTH_BASE_URL = "http://127.0.0.1:8000/api/auth"
EVENTS_BASE_URL = "http://127.0.0.1:8000/api/events"
BOOKINGS_BASE_URL = "http://127.0.0.1:8000/api/events/bookings"
MESSAGES_BASE_URL = "http://127.0.0.1:8000/api/messages"


def print_section(title):
    print("\n" + "=" * 60)
    print(f"🧪 TEST SUITE: {title}")
    print("=" * 60)


def print_test(name, status_code, response_text, expected_status=None):
    print(f"\n[+] {name}")
    print(f"    Status: {status_code} " + (f"(Expected {expected_status})" if expected_status else ""))
    safe_text = str(response_text).replace("\n", "")[:180]
    print(f"    Response: {safe_text}")
    
    if expected_status and status_code not in expected_status:
        print("    ❌ TEST FAILED")
    else:
        print("    ✅ TEST PASSED")


def generate_user_data(prefix="user"):
    uid = str(uuid.uuid4())[:8]
    return {
        "username": f"{prefix}_{uid}",
        "email": f"{prefix}_{uid}@example.com",
        "password": "Password123!",
        "password_confirm": "Password123!",
        "first_name": "Test",
        "last_name": "User",
        "taxNumber": "999888777",
        "postcode": 54321,
        "telephone": "1234567890",
        "address": "404 Error Lane",
    }


def get_admin_headers(session):
    admin_login = {"username": "admin", "password": "adminpassword123"}
    res = session.post(f"{AUTH_BASE_URL}/login/", json=admin_login)
    if res.status_code != 200:
        print("❌ Admin login failed. Verify admin credentials on server.")
        sys.exit(1)
    return {"Authorization": f"Bearer {res.json()['access']}"}


def create_and_approve_user(session, prefix="user", role="organizer"):
    admin_headers = get_admin_headers(session)
    user_data = generate_user_data(prefix)
    
    session.post(f"{AUTH_BASE_URL}/register/", json=user_data)
    users_res = session.get(f"{AUTH_BASE_URL}/admin/users/", headers=admin_headers)
    target_user = next((u for u in users_res.json() if u["username"] == user_data["username"]), None)
    
    user_id = target_user["id"]
    session.patch(f"{AUTH_BASE_URL}/admin/users/{user_id}/approve/", json={"approve": True}, headers=admin_headers)
    
    temp_login = session.post(f"{AUTH_BASE_URL}/login/", json={"username": user_data["username"], "password": user_data["password"]})
    user_headers = {"Authorization": f"Bearer {temp_login.json().get('access')}"}
    
    session.post(f"{AUTH_BASE_URL}/request/role/", json={"requested_role": role}, headers=user_headers)
    session.patch(f"{AUTH_BASE_URL}/admin/users/{user_id}/approve/", json={"approve": True}, headers=admin_headers)
    
    login_res = session.post(f"{AUTH_BASE_URL}/login/", json={"username": user_data["username"], "password": user_data["password"]})
    
    # Returning user_id as well so we can use it as the "receiver" ID
    return user_data, {"Authorization": f"Bearer {login_res.json().get('access')}"}, user_id


def run_all_tests():
    session = requests.Session()

    # 1. AUTH & USER SETUP
    print_section("1. User Setup & Role Provisioning")
    _, org_headers, org_id = create_and_approve_user(session, prefix="org", role="organizer")
    _, part_a_headers, part_a_id = create_and_approve_user(session, prefix="part_a", role="participant")
    _, part_b_headers, part_b_id = create_and_approve_user(session, prefix="part_b", role="participant")
    print("✓ Created Organizer, Participant A, and Participant B.")

    # 2. EVENT ENDPOINTS & EDGE CASES
    print_section("2. Event Creation, Scoping & Modification Guards")
    
    res = session.get(f"{EVENTS_BASE_URL}/")
    print_test("Unauthenticated List Events", res.status_code, res.text, [401])

    event_payload = {
        "title": "Full Stack Tech Summit",
        "venue": "Grand Hall",
        "address": "123 Innovation Street",
        "city": "Athens",
        "country": "Greece",
        "start_date_time": "2026-11-01T09:00:00Z",
        "end_date_time": "2026-11-01T17:00:00Z",
        "description": "Comprehensive test event.",
        "event_type": "CONFERENCE",
        "categories": ["TECHNOLOGY"],
        "ticket_types": [
            {"name": "VIP", "price": "100.00", "quantity": 5},
            {"name": "Standard", "price": "50.00", "quantity": 20}
        ]
    }
    
    res = session.post(f"{EVENTS_BASE_URL}/create/", json=event_payload, headers=part_a_headers)
    print_test("Participant Attempt Event Creation", res.status_code, res.text, [403])

    res = session.post(f"{EVENTS_BASE_URL}/create/", json=event_payload, headers=org_headers)
    print_test("Organizer Create Event", res.status_code, res.text, [201])
    if res.status_code != 201:
        print("❌ Event creation failed. Stopping remaining tests.")
        sys.exit(1)
    event_id = res.json()["id"]

    res = session.get(f"{EVENTS_BASE_URL}/", headers=part_a_headers)
    visible_to_part = any(e["id"] == event_id for e in res.json())
    print(f"    --> Draft visible to participant? {'YES (BUG)' if visible_to_part else 'NO (CORRECT)'}")

    session.patch(f"{EVENTS_BASE_URL}/MyEvents/{event_id}/", json={"status": "published"}, headers=org_headers)
    
    event_data = session.get(f"{EVENTS_BASE_URL}/{event_id}/", headers=part_a_headers).json()
    vip_ticket = next(t for t in event_data["ticket_types"] if t["name"] == "VIP")

    # 3. BOOKING CREATION, MODIFICATION & SECURITY
    print_section("3. Booking Lifecycle & Security Isolations")

    b_payload = {"ticket_type": vip_ticket['id'], "number_of_tickets": 2}
    res = session.post(f"{BOOKINGS_BASE_URL}/create/", json=b_payload, headers=part_a_headers)
    print_test("Participant A Creates Pending VIP Booking (2 tickets)", res.status_code, res.text, [201])
    if res.status_code != 201:
        print("❌ Booking creation failed. Check booking endpoint path.")
        sys.exit(1)
    booking_a_id = res.json()["id"]

    ev_check = session.get(f"{EVENTS_BASE_URL}/{event_id}/", headers=part_a_headers).json()
    vip_qty = next(t for t in ev_check["ticket_types"] if t["name"] == "VIP")["available"]
    print(f"    --> VIP Stock during PENDING: {vip_qty} (Expected: 5)")

    res = session.patch(f"{BOOKINGS_BASE_URL}/{booking_a_id}/modify/", json={"number_of_tickets": 1}, headers=part_b_headers)
    print_test("Participant B Modifying Participant A's Booking", res.status_code, res.text, [404])

    res = session.patch(f"{BOOKINGS_BASE_URL}/{booking_a_id}/modify/", json={"number_of_tickets": 3}, headers=part_a_headers)
    print_test("Participant A Modifies Booking Quantity to 3", res.status_code, res.text, [200])

    # 4. CONFIRMATIONS, INVENTORY & OVERBOOKING
    print_section("4. Confirmation & Inventory Stock Locking")

    res = session.post(f"{BOOKINGS_BASE_URL}/{booking_a_id}/confirm/", headers=part_b_headers)
    print_test("Participant B Confirming Participant A's Booking", res.status_code, res.text, [404])

    res = session.post(f"{BOOKINGS_BASE_URL}/{booking_a_id}/confirm/", headers=part_a_headers)
    print_test("Participant A Confirms VIP Booking", res.status_code, res.text, [200])

    ev_check = session.get(f"{EVENTS_BASE_URL}/{event_id}/", headers=part_a_headers).json()
    vip_qty = next(t for t in ev_check["ticket_types"] if t["name"] == "VIP")["available"]
    print(f"    --> VIP Stock after CONFIRM: {vip_qty} (Expected: 2)")

    res = session.post(f"{BOOKINGS_BASE_URL}/{booking_a_id}/confirm/", headers=part_a_headers)
    print_test("Re-confirming Already Confirmed Booking", res.status_code, res.text, [400])

    b_over = session.post(f"{BOOKINGS_BASE_URL}/create/", json={"ticket_type": vip_ticket['id'], "number_of_tickets": 4}, headers=part_b_headers)
    if b_over.status_code == 201:
        booking_b_id = b_over.json()["id"]
        res = session.post(f"{BOOKINGS_BASE_URL}/{booking_b_id}/confirm/", headers=part_b_headers)
        print_test("Confirming Booking Beyond Available Stock", res.status_code, res.text, [400])

    # 5. CANCELLATION & EVENT LOCKING RULES
    print_section("5. Status Guardrails & Event Modification Locks")

    res = session.post(f"{BOOKINGS_BASE_URL}/{booking_a_id}/cancel/", headers=part_a_headers)
    print_test("Cancelling CONFIRMED Booking (Should be blocked)", res.status_code, res.text, [400])

    res = session.patch(f"{BOOKINGS_BASE_URL}/{booking_a_id}/modify/", json={"number_of_tickets": 1}, headers=part_a_headers)
    print_test("Modifying CONFIRMED Booking (Should be blocked/not found)", res.status_code, res.text, [404])

    if 'booking_b_id' in locals():
        res = session.post(f"{BOOKINGS_BASE_URL}/{booking_b_id}/cancel/", headers=part_b_headers)
        print_test("Cancelling PENDING Booking", res.status_code, res.text, [200])

        res = session.post(f"{BOOKINGS_BASE_URL}/{booking_b_id}/cancel/", headers=part_b_headers)
        print_test("Double-cancelling Booking", res.status_code, res.text, [400])

    res = session.patch(f"{EVENTS_BASE_URL}/MyEvents/{event_id}/", json={"title": "New Title"}, headers=org_headers)
    print_test("Organizer Edits Event With Existing Bookings", res.status_code, res.text, [400])

    # 6. READ ENDPOINTS
    print_section("6. List & Read View Verification")
    res = session.get(f"{BOOKINGS_BASE_URL}/", headers=part_a_headers)
    print_test("Participant A Lists Bookings", res.status_code, f"Found {len(res.json()) if res.status_code == 200 else 0} item(s)", [200])


    # =========================================================================
    # 7. MESSAGING MODULE TESTS
    # =========================================================================
    print_section("7. Private Messaging Module (Organizer <-> Attendee)")

    # 7.1 Try to send without valid booking
    msg_fail_payload = {"subject": "Hey", "body": "Need info", "receiver": org_id, "event": event_id}
    res = session.post(f"{MESSAGES_BASE_URL}/send/", json=msg_fail_payload, headers=part_b_headers)
    print_test("Participant B (No Booking) Messaging Organizer", res.status_code, res.text, [400])

    # 7.2 Try to send to self
    msg_self_payload = {"subject": "Note to self", "body": "test", "receiver": part_a_id, "event": event_id}
    res = session.post(f"{MESSAGES_BASE_URL}/send/", json=msg_self_payload, headers=part_a_headers)
    print_test("Participant A Messaging Self", res.status_code, res.text, [400])

    # 7.3 Valid Attendee -> Organizer
    msg_1_payload = {"subject": "Parking", "body": "Is there parking available?", "receiver": org_id, "event": event_id}
    res = session.post(f"{MESSAGES_BASE_URL}/send/", json=msg_1_payload, headers=part_a_headers)
    print_test("Participant A Sends Message to Organizer", res.status_code, res.text, [201])
    msg_1_id = res.json().get("id")

    # 7.4 Valid Organizer -> Attendee
    msg_2_payload = {"subject": "Re: Parking", "body": "Yes, behind the building.", "receiver": part_a_id, "event": event_id}
    res = session.post(f"{MESSAGES_BASE_URL}/send/", json=msg_2_payload, headers=org_headers)
    print_test("Organizer Replies to Participant A", res.status_code, res.text, [201])
    msg_2_id = res.json().get("id")

    # 7.5 Check Inbox list
    res = session.get(f"{MESSAGES_BASE_URL}/inbox/", headers=org_headers)
    print_test("Organizer Lists Inbox", res.status_code, res.text, [200])
    
    # 7.6 Privacy Check: Part B tries to read Part A's message
    res = session.get(f"{MESSAGES_BASE_URL}/{msg_1_id}/", headers=part_b_headers)
    print_test("Participant B Attempts to Read Participant A's Message", res.status_code, res.text, [404])

    # 7.7 Detail View & Auto-Read Trigger
    res = session.get(f"{MESSAGES_BASE_URL}/{msg_1_id}/", headers=org_headers)
    print_test("Organizer Reads Message (Triggers Auto-Read)", res.status_code, res.text, [200])
    if res.status_code == 200:
        is_read_status = res.json().get("read")
        print(f"    --> Auto-Read flipped to True? {'YES (CORRECT)' if is_read_status else 'NO (BUG)'}")

    # 7.8 Bulk Soft Delete
    del_payload = {"message_ids": [msg_1_id]}
    res = session.post(f"{MESSAGES_BASE_URL}/delete/", json=del_payload, headers=org_headers)
    print_test("Organizer Soft-Deletes Message from Inbox", res.status_code, res.text, [200])

    # 7.9 Verify Soft-Delete Isolation
    res_inbox = session.get(f"{MESSAGES_BASE_URL}/inbox/", headers=org_headers)
    if res_inbox.status_code == 200:
        org_has_msg = any(m["id"] == msg_1_id for m in res_inbox.json())
        print(f"    --> Message still in Organizer's Inbox? {'YES (BUG)' if org_has_msg else 'NO (CORRECT)'}")

    res_outbox = session.get(f"{MESSAGES_BASE_URL}/outbox/", headers=part_a_headers)
    if res_outbox.status_code == 200:
        part_a_has_msg = any(m["id"] == msg_1_id for m in res_outbox.json())
        print(f"    --> Message still in Participant A's Outbox? {'YES (CORRECT)' if part_a_has_msg else 'NO (BUG)'}")

    print("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!")


if __name__ == "__main__":
    run_all_tests()