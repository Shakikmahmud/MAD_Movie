const API_BASE = "/api";

function getToken() {
    return localStorage.getItem("token");
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/";
}

function ensureAuthenticated() {
    const token = getToken();
    if (!token && window.location.pathname !== "/" && window.location.pathname !== "/register-page") {
        window.location.href = "/";
    }
}

async function registerUser() {
    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;
    const msg = document.getElementById("registerMessage");

    const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
        msg.className = "mt-3 text-success text-center";
        msg.innerText = data.message;
    } else {
        msg.className = "mt-3 text-danger text-center";
        msg.innerText = data.detail || "Registration failed";
    }
}

async function loginUser() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    const msg = document.getElementById("loginMessage");

    const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("username", username);
        window.location.href = "/dashboard";
    } else {
        msg.innerText = data.detail || "Login failed";
    }
}

function clearForm() {
    document.getElementById("movieId").value = "";
    document.getElementById("title").value = "";
    document.getElementById("director").value = "";
    document.getElementById("genre").value = "";
    document.getElementById("year").value = "";
    document.getElementById("rating").value = "";
}

function editMovie(movie) {
    document.getElementById("movieId").value = movie.id;
    document.getElementById("title").value = movie.title;
    document.getElementById("director").value = movie.director;
    document.getElementById("genre").value = movie.genre;
    document.getElementById("year").value = movie.year;
    document.getElementById("rating").value = movie.rating;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveMovie() {
    const id = document.getElementById("movieId").value;

    const payload = {
        title: document.getElementById("title").value.trim(),
        director: document.getElementById("director").value.trim(),
        genre: document.getElementById("genre").value.trim(),
        year: parseInt(document.getElementById("year").value),
        rating: parseFloat(document.getElementById("rating").value)
    };

    const msg = document.getElementById("movieMessage");

    if (!payload.title || !payload.director || !payload.genre || isNaN(payload.year) || isNaN(payload.rating)) {
        msg.className = "mt-3 text-danger";
        msg.innerText = "Please fill in all fields correctly.";
        return;
    }

    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE}/movies/${id}` : `${API_BASE}/movies`;

    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
        msg.className = "mt-3 text-success";
        msg.innerText = id ? "Movie updated successfully" : "Movie created successfully";
        clearForm();
        loadMovies();
        loadDashboard();
    } else {
        msg.className = "mt-3 text-danger";
        msg.innerText = data.detail || "Operation failed";
    }
}

async function deleteMovie(id) {
    if (!confirm("Are you sure you want to delete this movie?")) return;

    const res = await fetch(`${API_BASE}/movies/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    if (res.ok) {
        loadMovies();
        loadDashboard();
    } else {
        alert("Delete failed");
    }
}

async function loadMovies() {
    const tbody = document.getElementById("moviesTableBody");
    if (!tbody) return;

    const search = document.getElementById("searchBox")?.value || "";
    const genre = document.getElementById("genreFilter")?.value || "";
    const director = document.getElementById("directorFilter")?.value || "";
    const year = document.getElementById("yearFilter")?.value || "";
    const minRating = document.getElementById("ratingFilter")?.value || "";
    const sortBy = document.getElementById("sortBy")?.value || "";

    const params = new URLSearchParams();

    if (search) params.append("search", search);
    if (genre) params.append("genre", genre);
    if (director) params.append("director", director);
    if (year) params.append("year", year);
    if (minRating) params.append("min_rating", minRating);
    if (sortBy) params.append("sort_by", sortBy);

    const res = await fetch(`${API_BASE}/movies?${params.toString()}`, {
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    if (!res.ok) {
        tbody.innerHTML = `<tr><td colspan="7">Unauthorized or failed to load movies</td></tr>`;
        return;
    }

    const movies = await res.json();

    if (movies.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">No movies found</td></tr>`;
        return;
    }

    tbody.innerHTML = movies.map(movie => `
        <tr>
            <td>${movie.id}</td>
            <td>${movie.title}</td>
            <td>${movie.director}</td>
            <td>${movie.genre}</td>
            <td>${movie.year}</td>
            <td>${movie.rating}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick='editMovie(${JSON.stringify(movie)})'>Edit</button>
                <button class="btn btn-sm btn-danger" onclick='deleteMovie(${movie.id})'>Delete</button>
            </td>
        </tr>
    `).join("");
}

function resetFilters() {
    const searchBox = document.getElementById("searchBox");
    const genreFilter = document.getElementById("genreFilter");
    const directorFilter = document.getElementById("directorFilter");
    const yearFilter = document.getElementById("yearFilter");
    const ratingFilter = document.getElementById("ratingFilter");
    const sortBy = document.getElementById("sortBy");

    if (searchBox) searchBox.value = "";
    if (genreFilter) genreFilter.value = "";
    if (directorFilter) directorFilter.value = "";
    if (yearFilter) yearFilter.value = "";
    if (ratingFilter) ratingFilter.value = "";
    if (sortBy) sortBy.value = "";

    loadMovies();
}

function createMovieCard(movie) {
    const firstLetter = movie.title ? movie.title.charAt(0).toUpperCase() : "M";

    return `
        <div class="movie-card-modern">
            <div class="movie-poster">
                <div class="poster-letter">${firstLetter}</div>
            </div>
            <div class="movie-body">
                <div class="movie-title">${movie.title}</div>
                <div class="movie-meta">
                    ${movie.director}<br>
                    ${movie.genre} • ${movie.year}
                </div>
                <span class="movie-rating">⭐ ${movie.rating}</span>
            </div>
        </div>
    `;
}

async function loadDashboard() {
    const totalMoviesEl = document.getElementById("totalMovies");
    const avgRatingEl = document.getElementById("avgRating");
    const topMovieEl = document.getElementById("topMovie");
    const genreCountEl = document.getElementById("genreCount");
    const commonGenreEl = document.getElementById("commonGenre");
    const topRatedRow = document.getElementById("topRatedRow");
    const latestRow = document.getElementById("latestRow");
    const genreChips = document.getElementById("genreChips");
    const usernameEl = document.getElementById("dashboardUsername");

    if (!totalMoviesEl) return;

    const token = getToken();
    if (!token) {
        window.location.href = "/";
        return;
    }

    const storedUsername = localStorage.getItem("username");
    if (usernameEl && storedUsername) {
        usernameEl.textContent = storedUsername;
    }

    try {
        const res = await fetch(`${API_BASE}/movies`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            window.location.href = "/";
            return;
        }

        const movies = await res.json();

        const totalMovies = movies.length;
        const avgRating = totalMovies > 0
            ? (movies.reduce((sum, m) => sum + Number(m.rating || 0), 0) / totalMovies).toFixed(1)
            : "0.0";

        const uniqueGenres = [...new Set(movies.map(m => m.genre).filter(Boolean))];
        const sortedByRating = [...movies].sort((a, b) => b.rating - a.rating);
        const sortedLatest = [...movies].sort((a, b) => b.id - a.id);

        const genreFrequency = {};
        movies.forEach(movie => {
            if (movie.genre) {
                genreFrequency[movie.genre] = (genreFrequency[movie.genre] || 0) + 1;
            }
        });

        let mostCommonGenre = "N/A";
        let maxCount = 0;
        for (const genre in genreFrequency) {
            if (genreFrequency[genre] > maxCount) {
                maxCount = genreFrequency[genre];
                mostCommonGenre = genre;
            }
        }

        totalMoviesEl.textContent = totalMovies;
        avgRatingEl.textContent = avgRating;
        genreCountEl.textContent = uniqueGenres.length;
        topMovieEl.textContent = sortedByRating.length > 0 ? sortedByRating[0].title : "N/A";

        if (commonGenreEl) {
            commonGenreEl.textContent = mostCommonGenre;
        }

        if (genreChips) {
            genreChips.innerHTML = uniqueGenres.length > 0
                ? uniqueGenres.map(g => `<span class="genre-chip">${g}</span>`).join("")
                : `<span class="genre-chip">No genres yet</span>`;
        }

        if (topRatedRow) {
            const topRated = sortedByRating.slice(0, 4);
            topRatedRow.innerHTML = topRated.length
                ? topRated.map(createMovieCard).join("")
                : `<p class="text-muted">No movies available yet.</p>`;
        }

        if (latestRow) {
            const latestMovies = sortedLatest.slice(0, 4);
            latestRow.innerHTML = latestMovies.length
                ? latestMovies.map(createMovieCard).join("")
                : `<p class="text-muted">No movies available yet.</p>`;
        }

    } catch (error) {
        console.error("Dashboard load error:", error);
    }
}

window.addEventListener("load", () => {
    ensureAuthenticated();

    if (document.getElementById("moviesTableBody")) {
        loadMovies();
    }

    if (document.getElementById("totalMovies")) {
        loadDashboard();
    }
});