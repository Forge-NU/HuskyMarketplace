from fastapi import APIRouter

from app.core.errors import APIError
from app.schemas.common import ErrorResponse

router = APIRouter(prefix="/listings", tags=["listings"])

# Listing endpoints are built in #21. The search/sort/filter and saved-list SQL
# already in Supabase can be called from here with
#   get_user_client(user.access_token).rpc("function_name", {...}).execute()


@router.get("", responses={501: {"model": ErrorResponse}})
def list_listings() -> None:
    raise APIError(501, "not_implemented", "Listings API is not built yet (tracked in #21).")
