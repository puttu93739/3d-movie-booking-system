
import os
from datetime import timedelta
from uuid import UUID

from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    Header,
    HTTPException,
    Request,
    Response,
)
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RefreshSession, User
from app.schemas import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)
from app.security import (
    ACCESS_MINUTES,
    REFRESH_DAYS,
    create_access_token,
    decode_access_token,
    digest_token,
    generate_refresh_token,
    hash_password,
    utc_now,
    verify_password,
)

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])

ACCESS_COOKIE = "cineverse_access"
REFRESH_COOKIE = "cineverse_refresh"

COOKIE_SECURE = (
    os.getenv("AUTH_COOKIE_SECURE", "false").lower()
    == "true"
)

TRUSTED_ORIGIN = os.getenv(
    "FRONTEND_ORIGIN",
    "http://localhost:5173",
)


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
):
    response.set_cookie(
        key=ACCESS_COOKIE,
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=ACCESS_MINUTES * 60,
        path="/",
    )

    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=REFRESH_DAYS * 24 * 3600,
        path="/auth",
    )


def clear_auth_cookies(response: Response):
    response.delete_cookie(
        ACCESS_COOKIE,
        path="/",
        secure=COOKIE_SECURE,
        samesite="lax",
    )

    response.delete_cookie(
        REFRESH_COOKIE,
        path="/auth",
        secure=COOKIE_SECURE,
        samesite="lax",
    )


def check_origin(request: Request):
    origin = request.headers.get("origin")

    if origin != TRUSTED_ORIGIN:
        raise HTTPException(
            status_code=403,
            detail="Untrusted request origin",
        )


def create_session(db: Session, user: User):
    refresh_token = generate_refresh_token()

    session = RefreshSession(
        user_id=user.id,
        token_hash=digest_token(refresh_token),
        expires_at=utc_now() + timedelta(days=REFRESH_DAYS),
    )

    db.add(session)

    return (
        create_access_token(user.id),
        refresh_token,
    )


def get_current_user(
    access_token: str | None = Cookie(
        default=None,
        alias=ACCESS_COOKIE,
    ),
    db: Session = Depends(get_db),
) -> User:
    if not access_token:
        raise HTTPException(401, "Not authenticated")

    user_id = decode_access_token(access_token)
    user = db.get(User, user_id)

    if user is None or not user.is_active:
        raise HTTPException(401, "User is not available")

    return user


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=201,
    dependencies=[Depends(check_origin)],
)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = str(payload.email).lower()

    if db.scalar(
        select(User).where(User.email == email)
    ):
        raise HTTPException(409, "Email already registered")

    user = User(
        email=email,
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
    )

    try:
        db.add(user)
        db.flush()

        access_token, refresh_token = create_session(
            db, user
        )

        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email already registered")
    except Exception:
        db.rollback()
        raise

    set_auth_cookies(
        response, access_token, refresh_token
    )

    return AuthResponse(
        user=user,
        message="Registration successful",
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    dependencies=[Depends(check_origin)],
)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = str(payload.email).lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if (
        user is None
        or not verify_password(
            payload.password, user.password_hash
        )
    ):
        raise HTTPException(
            401, "Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(403, "Account disabled")

    try:
        access_token, refresh_token = create_session(
            db, user
        )
        db.commit()
    except Exception:
        db.rollback()
        raise

    set_auth_cookies(
        response, access_token, refresh_token
    )

    return AuthResponse(
        user=user,
        message="Login successful",
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def me(
    user: User = Depends(get_current_user),
):
    return user


@router.post(
    "/refresh",
    response_model=AuthResponse,
    dependencies=[Depends(check_origin)],
)
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(
        default=None,
        alias=REFRESH_COOKIE,
    ),
    db: Session = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(401, "Missing refresh token")

    token_hash = digest_token(refresh_token)
    now = utc_now()

    try:
        # Row-level locking serializes simultaneous refreshes
        # of the same session.
        session = db.scalar(
            select(RefreshSession)
            .where(RefreshSession.token_hash == token_hash)
            .with_for_update()
        )

        if (
            session is None
            or session.revoked_at is not None
            or session.expires_at <= now
        ):
            raise HTTPException(
                401, "Invalid refresh session"
            )

        user = db.get(User, session.user_id)

        if user is None or not user.is_active:
            raise HTTPException(
                401, "User is not available"
            )

        session.revoked_at = now

        access_token, new_refresh_token = (
            create_session(db, user)
        )

        db.commit()
    except Exception:
        db.rollback()
        raise

    set_auth_cookies(
        response, access_token, new_refresh_token
    )

    return AuthResponse(
        user=user,
        message="Session refreshed",
    )


@router.post(
    "/logout",
    dependencies=[Depends(check_origin)],
)
def logout(
    response: Response,
    refresh_token: str | None = Cookie(
        default=None,
        alias=REFRESH_COOKIE,
    ),
    db: Session = Depends(get_db),
):
    if refresh_token:
        try:
            db.execute(
                update(RefreshSession)
                .where(
                    RefreshSession.token_hash
                    == digest_token(refresh_token),
                    RefreshSession.revoked_at.is_(None),
                )
                .values(revoked_at=utc_now())
            )
            db.commit()
        except Exception:
            db.rollback()
            raise

    clear_auth_cookies(response)

    return {"message": "Logged out"}
