from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import json
import time

ROOT = Path(__file__).parent
DATA_FILE = ROOT / 'reservations.json'


def read_reservations():
    try:
        return json.loads(DATA_FILE.read_text(encoding='utf-8'))
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def write_reservations(reservations):
    DATA_FILE.write_text(json.dumps(reservations, indent=2), encoding='utf-8')


class RequestHandler(BaseHTTPRequestHandler):
    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if urlparse(self.path).path == '/api/reservations':
            self.send_json(read_reservations())
            return
        self.serve_file()

    def do_POST(self):
        if urlparse(self.path).path != '/api/reservations':
            self.send_error(404)
            return
        try:
            size = int(self.headers.get('Content-Length', 0))
            reservation = json.loads(self.rfile.read(size))
            reservation['id'] = str(int(time.time() * 1000))
            reservation['status'] = 'New'
            reservation['submittedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            reservations = read_reservations()
            reservations.insert(0, reservation)
            write_reservations(reservations)
            self.send_json(reservation, 201)
        except (ValueError, json.JSONDecodeError):
            self.send_json({'error': 'Invalid reservation'}, 400)

    def do_PATCH(self):
        reservation_id = urlparse(self.path).path.removeprefix('/api/reservations/')
        reservations = read_reservations()
        for reservation in reservations:
            if reservation['id'] == reservation_id:
                reservation['status'] = 'Confirmed' if reservation.get('status') != 'Confirmed' else 'New'
                write_reservations(reservations)
                self.send_json(reservation)
                return
        self.send_json({'error': 'Reservation not found'}, 404)

    def do_DELETE(self):
        path = urlparse(self.path).path
        if path == '/api/reservations':
            write_reservations([])
            self.send_json({'ok': True})
            return
        reservation_id = path.removeprefix('/api/reservations/')
        reservations = [item for item in read_reservations() if item['id'] != reservation_id]
        write_reservations(reservations)
        self.send_json({'ok': True})

    def serve_file(self):
        requested = urlparse(self.path).path.lstrip('/') or 'index.html'
        file_path = (ROOT / requested).resolve()
        if ROOT not in file_path.parents and file_path != ROOT:
            self.send_error(403)
            return
        if not file_path.is_file():
            self.send_error(404)
            return
        content_type = 'text/html; charset=utf-8' if file_path.suffix == '.html' else 'text/plain; charset=utf-8'
        if file_path.suffix == '.css':
            content_type = 'text/css; charset=utf-8'
        elif file_path.suffix == '.js':
            content_type = 'application/javascript; charset=utf-8'
        elif file_path.suffix == '.png':
            content_type = 'image/png'
        elif file_path.suffix in ('.jpg', '.jpeg'):
            content_type = 'image/jpeg'
        body = file_path.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format_string, *args):
        print(f'{self.address_string()} - {format_string % args}')


if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 4173), RequestHandler)
    print('Kaung Sett server running at http://localhost:4173')
    server.serve_forever()
