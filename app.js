let games = JSON.parse(localStorage.getItem('myGames')) || [];

function switchPage(pageId, element) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    element.classList.add('active');
    
    renderData();
}

function openModal() { document.getElementById('game-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('game-modal').style.display = 'none'; }

function toggleFormFields() {
    const status = document.getElementById('game-status').value;
    document.getElementById('upcoming-fields').style.display = status === 'upcoming' ? 'block' : 'none';
    document.getElementById('completed-fields').style.display = status === 'completed' ? 'block' : 'none';
    document.getElementById('wishlist-fields').style.display = status === 'wishlist' ? 'block' : 'none';
}

function saveGames() {
    localStorage.setItem('myGames', JSON.stringify(games));
    renderData();
}

function formatDates(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const gregorian = new Intl.DateTimeFormat('ar-SA').format(date);
    const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {day: 'numeric', month: 'long', year: 'numeric'}).format(date);
    return `${gregorian} م | ${hijri} هـ`;
}

document.getElementById('add-game-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newGame = {
        id: Date.now(),
        status: document.getElementById('game-status').value,
        title: document.getElementById('game-title').value,
        cover: document.getElementById('game-cover').value,
        genre: document.getElementById('game-genre').value,
        platforms: document.getElementById('game-platforms').value,
        releaseDate: document.getElementById('game-release-date').value,
        playtime: document.getElementById('game-playtime').value,
        rating: document.getElementById('game-rating').value,
        comment: document.getElementById('game-comment').value,
        completedDate: document.getElementById('game-completed-date').value,
        priority: document.getElementById('game-priority').value
    };

    games.push(newGame);
    saveGames();
    closeModal();
    this.reset();
});

function deleteGame(id) {
    if (confirm("هل أنت متأكد من حذف هذه اللعبة؟")) {
        games = games.filter(g => g.id !== id);
        saveGames();
    }
}

function updateCountdowns() {
    document.querySelectorAll('.countdown-timer').forEach(el => {
        const target = new Date(el.dataset.date).getTime();
        const now = new Date().getTime();
        const distance = target - now;

        if (distance < 0) {
            el.innerHTML = "تم الإصدار!";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        el.innerHTML = `باقي: ${days} يوم و ${hours} ساعة`;
    });
}
setInterval(updateCountdowns, 60000);

function renderData() {
    const upcomingGrid = document.getElementById('upcoming-grid');
    const completedGrid = document.getElementById('completed-grid');
    const wishlistGrid = document.getElementById('wishlist-grid');

    upcomingGrid.innerHTML = ''; completedGrid.innerHTML = ''; wishlistGrid.innerHTML = '';

    const upcomingGames = games.filter(g => g.status === 'upcoming').sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
    
    upcomingGames.forEach(g => {
        upcomingGrid.innerHTML += `
            <div class="game-card">
                <button class="delete-btn" onclick="deleteGame(${g.id})"><i class="fas fa-trash"></i></button>
                <img src="${g.cover}" alt="غلاف">
                <div class="game-info">
                    <div class="game-title">${g.title}</div>
                    <p style="font-size:12px; color:#aaa;">${formatDates(g.releaseDate)}</p>
                    <div class="countdown countdown-timer" data-date="${g.releaseDate}">جاري الحساب...</div>
                    <div style="margin-top:10px;">
                        <span class="badge">${g.platforms}</span>
                        <span class="badge" style="background:#555;">${g.genre}</span>
                    </div>
                </div>
            </div>`;
    });

    games.filter(g => g.status === 'completed').forEach(g => {
        completedGrid.innerHTML += `
            <div class="game-card">
                <button class="delete-btn" onclick="deleteGame(${g.id})"><i class="fas fa-trash"></i></button>
                <img src="${g.cover}" alt="غلاف">
                <div class="game-info">
                    <div class="game-title">${g.title} <span style="color:gold;">⭐ ${g.rating}/10</span></div>
                    <p style="font-size:12px; color:#aaa;">التختيم: ${formatDates(g.completedDate)} | ${g.playtime} ساعة</p>
                    <p style="margin-top:10px; font-size:14px;">"${g.comment}"</p>
                </div>
            </div>`;
    });

    games.filter(g => g.status === 'wishlist').forEach(g => {
        wishlistGrid.innerHTML += `
            <div class="game-card">
                <button class="delete-btn" onclick="deleteGame(${g.id})"><i class="fas fa-trash"></i></button>
                <img src="${g.cover}" alt="غلاف">
                <div class="game-info">
                    <div class="game-title">${g.title}</div>
                    <p style="color:var(--primary-color); font-weight:bold; margin-top:5px;">الأولوية: ${g.priority}</p>
                </div>
            </div>`;
    });

    updateCountdowns();
    calculateStats();
}

function calculateStats() {
    const completed = games.filter(g => g.status === 'completed');
    const totalPlaytime = completed.reduce((sum, g) => sum + (parseInt(g.playtime) || 0), 0);
    
    document.getElementById('stats-container').innerHTML = `
        <div class="stat-box">
            <h3>عدد الألعاب المختومة</h3>
            <p>${completed.length}</p>
        </div>
        <div class="stat-box">
            <h3>إجمالي ساعات اللعب</h3>
            <p>${totalPlaytime} ساعة</p>
        </div>
    `;
}

window.onload = renderData;

// === نظام البحث التلقائي (مخصص لألعاب PS و PC فقط) ===
const searchInput = document.getElementById('game-title');
const searchResults = document.getElementById('search-results');

const RAWG_API_KEY = '4ea2968a10604ee0bacd122f1ad00c'; 

searchInput.addEventListener('input', async function() {
    const query = this.value.trim();
    
    if (query.length < 3) {
        searchResults.style.display = 'none';
        return;
    }

    try {
        // فلترة النتائج لتشمل ألعاب البلايستيشن (18) والـ PC (4) حصرياً
        const response = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${query}&platforms=18,4&page_size=5`);
        const data = await response.json();

        searchResults.innerHTML = '';

        if (data.results && data.results.length > 0) {
            searchResults.style.display = 'block';
            
            data.results.forEach(game => {
                const item = document.createElement('div');
                item.className = 'search-item';
                
                const releaseYear = game.released ? game.released.split('-')[0] : 'غير معروف';
                const cover = game.background_image || 'https://via.placeholder.com/40';

                item.innerHTML = `
                    <img src="${cover}" alt="cover">
                    <div class="search-item-info">
                        <span class="search-item-title">${game.name}</span>
                        <span class="search-item-year">${releaseYear}</span>
                    </div>
                `;
                
                item.onclick = () => {
                    document.getElementById('game-title').value = game.name;
                    document.getElementById('game-cover').value = game.background_image || '';
                    
                    if (game.genres) {
                        document.getElementById('game-genre').value = game.genres.map(g => g.name).join('، ');
                    }
                    if (game.platforms) {
                        document.getElementById('game-platforms').value = game.platforms.map(p => p.platform.name).join('، ');
                    }
                    if (game.released) {
                        document.getElementById('game-release-date').value = game.released;
                    }

                    searchResults.style.display = 'none';
                };
                
                searchResults.appendChild(item);
            });
        } else {
            searchResults.style.display = 'none';
        }
    } catch (error) {
        console.error("حدث خطأ:", error);
    }
});

document.addEventListener('click', (e) => {
    if (e.target !== searchInput && e.target !== searchResults) {
        searchResults.style.display = 'none';
    }
});
