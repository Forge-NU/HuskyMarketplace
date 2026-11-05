from fastapi import APIRouter, Depends

from app.core.auth import CurrentUser, get_current_user
from app.schemas.common import ErrorResponse
from app.schemas.profiles import MeResponse

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=MeResponse, responses={401: {"model": ErrorResponse}})
def read_me(user: CurrentUser = Depends(get_current_user)) -> MeResponse:
    """Confirms a signed-in student's session reaches the backend.

    #20 replaces this with the student's row from the profiles table, read with
    get_user_client(user.access_token) so RLS applies.
    """
    return MeResponse(id=user.id, email=user.email)
