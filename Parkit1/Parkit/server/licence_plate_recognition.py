import cv2
import pytesseract
import firebase_admin
from firebase_admin import credentials, db, firestore
from datetime import datetime, timezone
import time
import re

# ----------------- Configuration -----------------
# Update these paths as needed
FIREBASE_CRED_PATH = "Parkit/server/dbcred.json"  # e.g., "C:\\path\\to\\dbcred.json"
FIREBASE_DB_URL = 'https://parkcam-55b53-default-rtdb.firebaseio.com/'
CASCADE_PATH = "Parkit/server/plate_recog.xml"  # e.g., "C:\\path\\to\\plate_recog.xml"
TESSERACT_CMD = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
# --------------------------------------------------

pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

# Initialize Firebase Admin SDK
cred = credentials.Certificate(FIREBASE_CRED_PATH)
firebase_admin.initialize_app(cred, {'databaseURL': FIREBASE_DB_URL})
firestore_db = firestore.client()

# ----------------- Utility Functions -----------------
def clean_text(text):
    """Clean OCR output: strip, remove non-alphanumeric, uppercase, limit to 10 characters."""
    cleaned_text = re.sub(r'[^a-zA-Z0-9]', '', text.strip()).upper()
    return cleaned_text[:10]

def is_between(entry_time, exit_time):
    """Return True if current UTC time is between entry_time and exit_time."""
    current_time = datetime.now(timezone.utc)
    return entry_time <= current_time <= exit_time

def get_user_bookings(plate_number):
    """
    Query Firestore for bookings matching the plate number.
    Returns a list of bookings sorted by entry time.
    """
    user_bookings_ref = firestore_db.collection('user_bookings')
    query = user_bookings_ref.where(field_path='plate_no', op_string='==', value=plate_number.lower())
    results = query.stream()
    bookings = []
    for doc in results:
        data = doc.to_dict()
        bookings.append({
            'entry_time': data['entry_time'],
            'exit_time': data['exit_time']
        })
    bookings = sorted(bookings, key=lambda x: x['entry_time'])
    print(f"Bookings for {plate_number}: {bookings}")  # Debug: show what bookings are found
    return bookings

def update_gate_status(open_gate=True):
    """
    Update the Firebase realtime database with the gate status.
    open_gate=True sets the gate open; otherwise, closed.
    """
    try:
        db.reference('/').update({'gate': open_gate})
        state = "opened" if open_gate else "closed"
        print(f"Gate {state} in database.")
    except Exception as e:
        print("Failed to update gate status:", e)

# ----------------- Plate Recognition and Firebase Integration -----------------
def recognize_plate():
    # Load Haar cascade for license plate detection
    plate_cascade = cv2.CascadeClassifier(CASCADE_PATH)

    # Initialize video capture
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open camera")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame")
            continue

        frame = cv2.resize(frame, (640, 480))
        cv2.rectangle(frame, (100, 100), (540, 360), (0, 255, 0), 2)

        # Preprocessing: convert to grayscale, apply blur, and adaptive thresholding
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.adaptiveThreshold(blurred, 255, 
                                       cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                       cv2.THRESH_BINARY_INV, 11, 2)

        # Detect plates using the Haar cascade on thresholded image
        plates = plate_cascade.detectMultiScale(thresh, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        for (x, y, w, h) in plates:
            if 100 < x < 440 and 100 < y < 380:  # Process only if within the expected region
                roi = frame[y:y+h, x:x+w]
                roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                plate_text = pytesseract.image_to_string(roi_gray, config='--psm 7')
                cleaned_plate_number = clean_text(plate_text)
                cv2.putText(frame, f"Plate Text: {cleaned_plate_number}", (x, y - 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
                
                # Validate license plate format (example: two letters, two digits, two letters, four digits)
                if re.match(r'^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$', cleaned_plate_number):
                    print("License Plate Number:", cleaned_plate_number)
                    
                    # Get user bookings and verify if current time fits any booking window
                    bookings = get_user_bookings(cleaned_plate_number)
                    
                    if not bookings:
                        print("No bookings found for this license plate.")
                    else:
                        active_booking = False
                        for booking in bookings:
                            if is_between(booking['entry_time'], booking['exit_time']):
                                print("Active booking found. Opening gate for", cleaned_plate_number)
                                update_gate_status(True)
                                time.sleep(10)  # Keep gate open for 3 seconds
                                update_gate_status(False)
                                active_booking = True
                                break
                            elif booking['entry_time'] > datetime.now(timezone.utc):
                                print("Booking exists, but too early. Booking starts at:",
                                      booking['entry_time'].strftime('%Y-%m-%d %H:%M:%S'))
                                active_booking = True
                                break
                        if not active_booking:
                            print("No active booking matches the current time for", cleaned_plate_number)
                    
                    
        cv2.imshow('Frame', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

# ----------------- Main -----------------
if __name__ == "__main__":
    recognize_plate()
