import time
from typing import Dict, List, Optional
from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    """Sliding window rate limiter per client IP address with automatic stale entry cleanup."""

    def __init__(self, max_requests: int = 30, window_seconds: int = 60, max_tracked_ips: int = 1000):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.max_tracked_ips = max_tracked_ips
        self.requests: Dict[str, List[float]] = {}

    def cleanup_stale_entries(self, now: Optional[float] = None) -> int:
        """Purge all expired client IP entries from memory. Returns number of purged keys."""
        if now is None:
            now = time.time()
        window_start = now - self.window_seconds

        stale_keys = [
            ip for ip, timestamps in self.requests.items()
            if not timestamps or timestamps[-1] <= window_start
        ]
        for ip in stale_keys:
            self.requests.pop(ip, None)
        return len(stale_keys)

    def check_rate_limit(self, client_ip: Optional[str]):
        """
        Check rate limit for client IP.
        Safely allows requests when client address is missing or unknown.
        """
        if not client_ip or not client_ip.strip() or client_ip == "unknown":
            return

        client_ip = client_ip.strip()
        now = time.time()
        window_start = now - self.window_seconds

        # Periodic bulk cleanup if tracked IPs exceed threshold
        if len(self.requests) > self.max_tracked_ips:
            self.cleanup_stale_entries(now)

        # Retrieve and filter timestamps within the sliding window
        timestamps = self.requests.get(client_ip, [])
        active_timestamps = [ts for ts in timestamps if ts > window_start]

        if not active_timestamps and client_ip in self.requests:
            # If all past requests expired, clean up the entry
            self.requests.pop(client_ip, None)

        if len(active_timestamps) >= self.max_requests:
            self.requests[client_ip] = active_timestamps
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many submissions. Please wait a moment and try again."
            )

        active_timestamps.append(now)
        self.requests[client_ip] = active_timestamps

    def reset(self):
        """Reset all rate limiter state (useful for test isolation)."""
        self.requests.clear()


def resolve_client_ip(request: Request) -> Optional[str]:
    """
    Extract client IP resolved by ASGI server / trusted ProxyHeadersMiddleware.
    Does not blindly trust unverified headers in application code.
    """
    if request.client and request.client.host:
        host = request.client.host.strip()
        if host and host != "unknown":
            return host
    return None


# Global instances for abuse protection on public forms
newsletter_limiter = InMemoryRateLimiter(max_requests=10, window_seconds=60)
contact_limiter = InMemoryRateLimiter(max_requests=5, window_seconds=60)

