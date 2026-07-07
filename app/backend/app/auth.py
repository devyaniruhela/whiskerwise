"""Identity — Supabase Auth is used for identity/session only (anonymous sign-ins v1).
FastAPI verifies the Supabase JWT via the project's public JWKS endpoint; User.id
mirrors auth.users.id. Dev fallback: with require_auth off (config), a missing/invalid
token maps to a fixed dev user so curl/local testing works without the FE.
"""

import logging
import os
from functools import lru_cache
from typing import Optional

from fastapi import Header, HTTPException

from .config import get_config

log = logging.getLogger("wiser.auth")
DEV_USER_ID = "00000000-0000-0000-0000-000000000001"


@lru_cache
def _jwk_client():
    import jwt
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    return jwt.PyJWKClient(f"{url}/auth/v1/.well-known/jwks.json") if url else None


def _verify(token: str) -> Optional[str]:
    import jwt
    client = _jwk_client()
    if client is None:
        return None
    key = client.get_signing_key_from_jwt(token).key
    claims = jwt.decode(token, key, algorithms=["RS256", "ES256"], audience="authenticated")
    return claims.get("sub")


def current_user_id(authorization: Optional[str] = Header(default=None)) -> str:
    require = get_config().get("features", {}).get("require_auth", False)
    token = authorization.split(" ", 1)[1] if authorization and " " in authorization else None
    if token:
        try:
            sub = _verify(token)
            if sub:
                return sub
        except Exception as e:  # noqa: BLE001 — invalid token handled below
            log.warning("jwt verify failed: %s", e)
        if require:
            raise HTTPException(401, "Invalid session token.")
    elif require:
        raise HTTPException(401, "Sign-in required.")
    return DEV_USER_ID
