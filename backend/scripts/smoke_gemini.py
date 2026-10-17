"""Owner-only opt-in, one fictional turn through Next.js → FastAPI → Gemini."""

import argparse
from urllib.parse import urlsplit


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--base-url", default="http://127.0.0.1:3000")
    args = parser.parse_args()
    if not args.live:
        print("Skipped: live Gemini smoke requires explicit --live. No request made.")
        return
    url = urlsplit(args.base_url)
    if (
        url.scheme != "http"
        or url.hostname not in ("127.0.0.1", "localhost", "::1")
        or url.username
        or url.password
        or url.path not in ("", "/")
        or url.query
        or url.fragment
    ):
        raise SystemExit("Use a loopback HTTP frontend origin.")
    import httpx

    try:
        with httpx.Client(
            base_url=args.base_url, timeout=32, trust_env=False
        ) as client:
            status = client.get("/api/conversation/status")
            if status.status_code != 200 or status.json().get("enabled") is not True:
                print(
                    "Skipped: local AI configuration is unavailable or disabled. No generation requested."
                )
                return
            token = client.post("/api/conversation/session").json()["session_id"]
            response = client.post(
                "/api/conversation",
                json={
                    "session_id": token,
                    "campus_id": "bmcc",
                    "message": "This is a fictional scenario. I would like to explore my interests.",
                    "goal": "explore_programs",
                    "external_ai_consent": True,
                },
            )
            from app.conversation.contracts import ConversationResponse

            result = ConversationResponse.model_validate(response.json())
            if result.mode != "gemini":
                raise ValueError()
            print(
                "Passed: frontend proxy, backend and structured provider response available. No content logged."
            )
    except Exception:
        raise SystemExit(
            "Live smoke unavailable or response rejected. Check local configuration privately; no provider details logged."
        ) from None


if __name__ == "__main__":
    main()
