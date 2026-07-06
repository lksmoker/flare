from __future__ import annotations

import argparse
from wsgiref.simple_server import make_server

from backend.app.http.app import build_support_channel_http_app


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the Flare backend HTTP runtime for support-channel validation."
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9001)
    args = parser.parse_args()

    app = build_support_channel_http_app()
    with make_server(args.host, args.port, app) as server:
        print(f"Flare backend listening on http://{args.host}:{args.port}")
        server.serve_forever()


if __name__ == "__main__":
    main()
