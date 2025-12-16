// --- SPLASH SCREEN CLEANUP ---
window.addEventListener('load', () => {
    // Remove splash screen element after animation completes to free up DOM
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if(splash) {
            splash.style.display = 'none';
        }
    }, 4100); // 4.1 seconds (just after animation ends)
});

// --- DATA INITIALIZATION ---
let wordsData = [];
let quotesData = [
    "There is a crack in everything. That's how the light gets in."
];
let profilePhotos = { netti: null, billy: null };
const API_BASE = '/.netlify/functions';

// ═══════════════════════════════════════════════════
// THE PULSE - Presence Indicator
// ═══════════════════════════════════════════════════
let pulseTimeout = null;

function initPulse() {
    updatePulse();
    window.addEventListener('focus', updatePulse);
    window.addEventListener('blur', () => {
        clearTimeout(pulseTimeout);
        pulseTimeout = setTimeout(() => {
            document.body.classList.remove('pulse-active');
        }, 10000);
    });
}

function updatePulse() {
    clearTimeout(pulseTimeout);
    if (document.hasFocus()) {
        document.body.classList.add('pulse-active');
    }
}

// Future: WebSocket/Neon DB connection
function checkPartnerPresence() {
    return false;
}

// ═══════════════════════════════════════════════════
// FADING INK - Memory Decay
// ═══════════════════════════════════════════════════
function getInkClass(lastInteracted) {
    if (!lastInteracted) return 'ink-fresh';
    const now = Date.now();
    const daysSince = (now - new Date(lastInteracted).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) return 'ink-fresh';
    if (daysSince < 30) return 'ink-aging';
    return 'ink-faded';
}

async function refreshWord(index) {
    const word = wordsData[index];
    try {
        const res = await fetch(`${API_BASE}/words`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: word.id,
                german: word.german,
                english: word.english,
                refresh: true
            })
        });
        if (res.ok) {
            const updated = await res.json();
            wordsData[index] = updated;
            displayWords();
        }
    } catch (err) {
        console.error('Failed to refresh word:', err);
    }
}

// ═══════════════════════════════════════════════════
// THE VEIL - Privacy Gate
// ═══════════════════════════════════════════════════
const PASSPHRASE = 'tangerine';
let activeVeilInput = null;

function initVeil() {
    // Check if already unlocked this session
    if (sessionStorage.getItem('unveiled') === 'true') {
        document.body.classList.add('unlocked');
        return;
    }

    // Add click listeners to profile wrappers
    document.querySelectorAll('.profile-wrapper').forEach(wrapper => {
        wrapper.addEventListener('click', (e) => {
            // Don't trigger if clicking the file input label
            if (e.target.tagName === 'INPUT') return;
            e.preventDefault();
            e.stopPropagation();
            showVeilInput(wrapper);
        });
    });

    // Close veil input when clicking outside
    document.addEventListener('click', (e) => {
        if (activeVeilInput && !e.target.closest('.profile-wrapper')) {
            hideVeilInput();
        }
    });
}

function showVeilInput(wrapper) {
    // Remove any existing veil input
    hideVeilInput();

    // Create veil container
    const container = document.createElement('div');
    container.className = 'veil-container active';

    const input = document.createElement('input');
    input.type = 'password';
    input.className = 'veil-input';
    input.placeholder = 'whisper...';
    input.autocomplete = 'off';

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkVeilPassword(input, container);
        }
    });

    container.appendChild(input);
    wrapper.appendChild(container);
    activeVeilInput = container;

    // Focus after a brief delay for animation
    setTimeout(() => input.focus(), 100);
}

function hideVeilInput() {
    if (activeVeilInput) {
        activeVeilInput.remove();
        activeVeilInput = null;
    }
}

function checkVeilPassword(input, container) {
    if (input.value.toLowerCase() === PASSPHRASE) {
        unveil();
    } else {
        // Wrong password - shake and clear
        container.classList.add('shake');
        input.value = '';
        setTimeout(() => {
            container.classList.remove('shake');
        }, 400);
    }
}

function unveil() {
    sessionStorage.setItem('unveiled', 'true');
    document.body.classList.add('unlocked');
    hideVeilInput();
}

// --- QUOTE JAR LOGIC ---
function loadQuotes() {
    const saved = localStorage.getItem('userQuotesJar');
    if (saved) {
        quotesData = JSON.parse(saved);
    }
    cycleQuote();
}

function saveQuotes() {
    localStorage.setItem('userQuotesJar', JSON.stringify(quotesData));
}

async function cycleQuote() {
    const quoteEl = document.getElementById('quoteDisplay');
    const transEl = document.getElementById('quoteTranslation');

    if (quotesData.length === 0) {
        quoteEl.innerText = 'add your first whisper...';
        transEl.innerText = '';
        return;
    }

    const randomIndex = Math.floor(Math.random() * quotesData.length);
    const quote = quotesData[randomIndex];

    // Fade out
    quoteEl.style.opacity = 0;
    transEl.style.opacity = 0;

    setTimeout(async () => {
        quoteEl.innerText = quote;
        quoteEl.style.opacity = 0.8;

        // Detect language and translate
        const isGerman = /[äöüßÄÖÜ]/.test(quote) || await detectGerman(quote);
        const translation = await translateText(quote, isGerman ? 'de' : 'en', isGerman ? 'en' : 'de');

        if (translation && translation.toLowerCase() !== quote.toLowerCase()) {
            transEl.innerText = translation;
            transEl.style.opacity = 0.6;
        } else {
            transEl.innerText = '';
        }
    }, 300);
}

async function detectGerman(text) {
    // Simple heuristic: common German words
    const germanWords = ['der', 'die', 'das', 'und', 'ist', 'nicht', 'ich', 'du', 'wir', 'sie', 'ein', 'eine', 'mit', 'von', 'auf', 'für', 'als', 'auch', 'nur', 'noch', 'nach', 'bei', 'kann', 'wenn', 'aber', 'werden', 'sein', 'haben', 'wird', 'sind', 'war', 'mein', 'dein'];
    const words = text.toLowerCase().split(/\s+/);
    const germanCount = words.filter(w => germanWords.includes(w)).length;
    return germanCount >= 2;
}

function toggleQuoteInput() {
    const container = document.getElementById('quoteInputContainer');
    const input = document.getElementById('newQuoteInput');
    if (container.style.display === 'block') {
        container.style.display = 'none';
    } else {
        container.style.display = 'block';
        input.focus();
    }
}

function handleQuoteKey(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveNewQuote();
    }
}

function saveNewQuote() {
    const input = document.getElementById('newQuoteInput');
    const text = input.value.trim();
    if (text) {
        quotesData.push(text);
        saveQuotes();

        const quoteEl = document.getElementById('quoteDisplay');
        const transEl = document.getElementById('quoteTranslation');

        quoteEl.innerText = text;
        transEl.innerText = '';

        // Translate async
        (async () => {
            const isGerman = /[äöüßÄÖÜ]/.test(text) || await detectGerman(text);
            const translation = await translateText(text, isGerman ? 'de' : 'en', isGerman ? 'en' : 'de');
            if (translation && translation.toLowerCase() !== text.toLowerCase()) {
                transEl.innerText = translation;
                transEl.style.opacity = 0.6;
            }
        })();

        input.value = '';
        toggleQuoteInput();
    }
}

// --- VOCABULARY DATA API HANDLING ---
async function loadData() {
    try {
        const res = await fetch(`${API_BASE}/words`);
        if (res.ok) {
            wordsData = await res.json();
        } else { throw new Error('API not available'); }
    } catch (err) {
        // Fallback to localStorage
        const saved = localStorage.getItem('sharedWordsData');
        if (saved) wordsData = JSON.parse(saved);
    }
    displayWords();
}

async function addWord() {
    const g = document.getElementById('germanWord').value.trim();
    const e = document.getElementById('englishWord').value.trim();
    if (g && e) {
        const newEntry = { german: g, english: e, id: Date.now() }; // Local temp ID
        try {
            const res = await fetch(`${API_BASE}/words`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEntry)
            });
            if (res.ok) {
                const savedWord = await res.json();
                wordsData.unshift(savedWord);
            } else { throw new Error('API failed'); }
        } catch (err) {
            // Local fallback
            wordsData.unshift(newEntry);
            localStorage.setItem('sharedWordsData', JSON.stringify(wordsData));
        }
        displayWords();
        document.getElementById('germanWord').value = '';
        document.getElementById('englishWord').value = '';
    }
}

async function deleteWord(index) {
    const word = wordsData[index];
    try {
        await fetch(`${API_BASE}/words`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: word.id })
        });
    } catch (err) {
        console.log('Local delete only');
    }
    wordsData.splice(index, 1);
    localStorage.setItem('sharedWordsData', JSON.stringify(wordsData));
    displayWords();
}

function editWord(index) {
    const w = wordsData[index];
    const list = document.getElementById('wordsList');
    const entries = list.querySelectorAll('.entry');
    const entry = entries[index];

    entry.innerHTML = `
        <div class="word-col">
            <span class="lang-label">deutsch</span>
            <input type="text" class="edit-input" id="editGerman${index}" value="${escapeHtml(w.german)}" autocapitalize="off">
        </div>
        <div class="word-col">
            <span class="lang-label">english</span>
            <input type="text" class="edit-input" id="editEnglish${index}" value="${escapeHtml(w.english)}" autocapitalize="off">
        </div>
        <div class="entry-actions">
            <button class="save-edit-btn" onclick="saveEdit(${index})">save</button>
        </div>
    `;
}

async function saveEdit(index) {
    const german = document.getElementById('editGerman' + index).value.trim();
    const english = document.getElementById('editEnglish' + index).value.trim();
    const word = wordsData[index];

    if (german && english) {
        try {
            await fetch(`${API_BASE}/words`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: word.id, german, english })
            });
        } catch(err) { console.log('Local update only'); }
        
        wordsData[index].german = german;
        wordsData[index].english = english;
        localStorage.setItem('sharedWordsData', JSON.stringify(wordsData));
    }
    displayWords();
}

function displayWords() {
    const list = document.getElementById('wordsList');
    if (wordsData.length === 0) {
        list.innerHTML = '<div class="empty-state">begin with a word, and we will understand each other.</div>';
        return;
    }
    list.innerHTML = wordsData.map((w, i) => `
        <div class="entry ${getInkClass(w.last_interacted)}" onclick="refreshWord(${i})" title="Click to refresh memory">
            <div class="word-col">
                <span class="lang-label">deutsch</span>
                <div class="word-text">${escapeHtml(w.german)}</div>
            </div>
            <div class="word-col">
                <span class="lang-label">english</span>
                <div class="word-text">${escapeHtml(w.english)}</div>
            </div>
            <div class="entry-actions">
                <button class="edit-btn" onclick="event.stopPropagation(); editWord(${i})">&#9998;</button>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteWord(${i})">&times;</button>
            </div>
        </div>
    `).join('');
}

// --- PHOTO HANDLING ---
function uploadPhoto(person, event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profilePhotos[person] = e.target.result;
            displayPhoto(person, e.target.result);
            localStorage.setItem('profilePhotos', JSON.stringify(profilePhotos));
        };
        reader.readAsDataURL(file);
    }
}

function displayPhoto(person, imageData) {
    const container = document.getElementById(person + 'Pic');
    if (imageData) {
        container.innerHTML = `<img src="${imageData}" alt="${person}">`;
    } else {
        container.innerHTML = `<span class="default-avatar">${person.charAt(0)}.</span>`;
    }
}

function loadPhotos() {
    const saved = localStorage.getItem('profilePhotos');
    if (saved) {
        profilePhotos = JSON.parse(saved);
        if (profilePhotos.netti) displayPhoto('netti', profilePhotos.netti);
        if (profilePhotos.billy) displayPhoto('billy', profilePhotos.billy);
    }
}

// --- TRANSLATION API ---
async function translateText(text, s, t) {
    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${s}|${t}`);
        const data = await res.json();
        if (data.responseStatus === 200) {
            let translation = data.responseData.translatedText;
            // Match capitalization of original
            if (text === text.toLowerCase()) {
                translation = translation.toLowerCase();
            } else if (text === text.toUpperCase()) {
                translation = translation.toUpperCase();
            } else if (text[0] === text[0].toLowerCase()) {
                translation = translation[0].toLowerCase() + translation.slice(1);
            }
            return translation;
        }
        return '';
    } catch { return ''; }
}

// --- UTILITIES ---
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

let isTranslating = false;

document.getElementById('germanWord').addEventListener('input', debounce(async (e) => {
    if (!e.target.value || isTranslating) return;
    const enInput = document.getElementById('englishWord');
    enInput.placeholder = '...';
    const trans = await translateText(e.target.value, 'de', 'en');
    if (trans) {
        isTranslating = true;
        enInput.value = trans;
        isTranslating = false;
    }
    enInput.placeholder = 'in english...';
}, 800));

document.getElementById('englishWord').addEventListener('input', debounce(async (e) => {
    if (!e.target.value || isTranslating) return;
    const deInput = document.getElementById('germanWord');
    deInput.placeholder = '...';
    const trans = await translateText(e.target.value, 'en', 'de');
    if (trans) {
        isTranslating = true;
        deInput.value = trans;
        isTranslating = false;
    }
    deInput.placeholder = 'auf deutsch...';
}, 800));

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- STARTUP ---
initVeil();
loadQuotes();
loadData();
loadPhotos();
initPulse();