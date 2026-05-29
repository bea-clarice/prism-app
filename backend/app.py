from http.server import BaseHTTPRequestHandler, HTTPServer
import json


class PrismHandler(BaseHTTPRequestHandler):
    def _send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json({"ok": True})

    def do_GET(self):
        if self.path == "/health":
            self._send_json({"status": "ok", "service": "prism-backend"})
            return

        self._send_json({"error": "Not found"}, status=404)


def run(host="127.0.0.1", port=8000):
    server = HTTPServer((host, port), PrismHandler)
    print(f"Prism backend running at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
