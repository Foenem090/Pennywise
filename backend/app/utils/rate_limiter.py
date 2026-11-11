import time
from collections import defaultdict
from fastapi import HTTPException, status


class InMemoryRateLimiter:
    """Sliding window rate limiter per client IP address."""

    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

    def check_rate_limit(self, client_ip: str):
        if not client_ip:
            return  # Default allow if client IP unknown

        now = time.time()
        window_start = now - self.window_seconds

        # Prune timestamps older than window
        self.requests[client_ip] = [
            ts for ts in self.requests[client_ip] if ts > window_start
        ]

        if len(self.requests[client_ip]) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many submissions. Please wait a moment and try again."
            )

        self.requests[client_ip].append(now)


# Global instances for abuse protection on public forms
newsletter_limiter = InMemoryRateLimiter(max_requests=10, window_seconds=60)
contact_limiter = InMemoryRateLimiter(max_requests=5, window_seconds=60)
