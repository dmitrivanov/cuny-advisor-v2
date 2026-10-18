"""Browser-test-only HTTP fixture for server-rendered registry reads, never runtime."""

from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

BODY = (Path(__file__).parents[1] / "fixtures/institutions.json").read_bytes()


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/api/v1/institutions":
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(BODY)

    def log_message(self, *args):
        pass


HTTPServer(("127.0.0.1", 3101), Handler).serve_forever()
