from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from . import schemas, crud, auth, models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Movie Library Web App")

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={}
    )


@app.get("/register-page", response_class=HTMLResponse)
def register_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="register.html",
        context={}
    )


@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={}
    )


@app.get("/movies-page", response_class=HTMLResponse)
def movies_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="movies.html",
        context={}
    )


@app.post("/api/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_username(db, user.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = auth.hash_password(user.password)
    crud.create_user(db, user.username, hashed_password)
    return {"message": "Registration successful"}


@app.post("/api/login", response_model=schemas.TokenResponse)
def login(user: schemas.LoginRequest, db: Session = Depends(get_db)):
    authenticated_user = auth.authenticate_user(db, user.username, user.password)
    if not authenticated_user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = auth.create_access_token({"sub": authenticated_user.username})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/movies", response_model=list[schemas.MovieResponse])
def read_movies(
    search: str = "",
    genre: str = "",
    director: str = "",
    min_rating: float | None = None,
    year: int | None = None,
    sort_by: str = "",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.get_movies(db, search, genre, director, min_rating, year, sort_by)


@app.post("/api/movies", response_model=schemas.MovieResponse)
def create_movie(
    movie: schemas.MovieCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.create_movie(db, movie)


@app.get("/api/movies/{movie_id}", response_model=schemas.MovieResponse)
def read_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    movie = crud.get_movie(db, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie


@app.put("/api/movies/{movie_id}", response_model=schemas.MovieResponse)
def update_movie(
    movie_id: int,
    movie: schemas.MovieUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    updated_movie = crud.update_movie(db, movie_id, movie)
    if not updated_movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return updated_movie


@app.delete("/api/movies/{movie_id}")
def delete_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    deleted_movie = crud.delete_movie(db, movie_id)
    if not deleted_movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return {"message": "Movie deleted successfully"}