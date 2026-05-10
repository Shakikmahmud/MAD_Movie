from pydantic import BaseModel, Field

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=4, max_length=72)

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class MovieBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    director: str = Field(..., min_length=1, max_length=100)
    genre: str = Field(..., min_length=1, max_length=50)
    year: int = Field(..., ge=1888, le=2100)
    rating: float = Field(..., ge=0, le=10)

class MovieCreate(MovieBase):
    pass

class MovieUpdate(MovieBase):
    pass

class MovieResponse(MovieBase):
    id: int

    model_config = {
        "from_attributes": True
    }