from sqlalchemy.orm import Session
from . import models, schemas


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def create_user(db: Session, username: str, hashed_password: str):
    user = models.User(username=username, password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_movie(db: Session, movie: schemas.MovieCreate):
    db_movie = models.Movie(**movie.model_dump())
    db.add(db_movie)
    db.commit()
    db.refresh(db_movie)
    return db_movie


def get_movies(
    db: Session,
    search: str = "",
    genre: str = "",
    director: str = "",
    min_rating: float | None = None,
    year: int | None = None,
    sort_by: str = "",
):
    query = db.query(models.Movie)

    if search:
        query = query.filter(models.Movie.title.ilike(f"%{search}%"))

    if genre:
        query = query.filter(models.Movie.genre.ilike(f"%{genre}%"))

    if director:
        query = query.filter(models.Movie.director.ilike(f"%{director}%"))

    if min_rating is not None:
        query = query.filter(models.Movie.rating >= min_rating)

    if year is not None:
        query = query.filter(models.Movie.year == year)

    if sort_by == "title_asc":
        query = query.order_by(models.Movie.title.asc())
    elif sort_by == "title_desc":
        query = query.order_by(models.Movie.title.desc())
    elif sort_by == "rating_desc":
        query = query.order_by(models.Movie.rating.desc())
    elif sort_by == "rating_asc":
        query = query.order_by(models.Movie.rating.asc())
    elif sort_by == "year_desc":
        query = query.order_by(models.Movie.year.desc())
    elif sort_by == "year_asc":
        query = query.order_by(models.Movie.year.asc())
    else:
        query = query.order_by(models.Movie.id.desc())

    return query.all()


def get_movie(db: Session, movie_id: int):
    return db.query(models.Movie).filter(models.Movie.id == movie_id).first()


def update_movie(db: Session, movie_id: int, movie: schemas.MovieUpdate):
    db_movie = get_movie(db, movie_id)
    if not db_movie:
        return None

    for key, value in movie.model_dump().items():
        setattr(db_movie, key, value)

    db.commit()
    db.refresh(db_movie)
    return db_movie


def delete_movie(db: Session, movie_id: int):
    db_movie = get_movie(db, movie_id)
    if not db_movie:
        return None

    db.delete(db_movie)
    db.commit()
    return db_movie