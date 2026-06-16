// ==========================================================================
// App State
// ==========================================================================
let state = {
    releases: [],
    filteredReleases: [],
    selectedReleaseId: null,
    categoryFilter: 'all',
    searchQuery: ''
};

// Category Emojis/Labels for Twitter Drafts
const CATEGORY_TWEET_METADATA = {
    'feature': { label: '📢 BigQuery Feature', tags: ' #BigQuery #GoogleCloud' },
    'issue': { label: '⚠️ BigQuery Issue', tags: ' #BigQuery #GoogleCloud #CloudSecurity' },
    'change': { label: '🔄 BigQuery Change', tags: ' #BigQuery #GoogleCloud' },
    'deprecated': { label: '🚫 BigQuery Deprecated', tags: ' #BigQuery #GoogleCloud #DataOps' },
    'update': { label: '📝 BigQuery Update', tags: ' #BigQuery #GoogleCloud' }
};

// ==========================================================================
// DOM Elements
// ==========================================================================
const elements = {
    refreshBtn: document.getElementById('refresh-btn'),
    refreshIcon: document.getElementById('refresh-icon'),
    searchInput: document.getElementById('search-input'),
    clearSearch: document.getElementById('clear-search'),
    categoryFiltersContainer: document.getElementById('category-filters-container'),
    resultsCount: document.getElementById('results-count'),
    releasesContainer: document.getElementById('releases-container'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    themeToggleBtn: document.getElementById('theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    
    // States
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    emptyState: document.getElementById('empty-state'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    
    // Composer
    composerEmpty: document.getElementById('composer-empty'),
    composerActive: document.getElementById('composer-active'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCounter: document.getElementById('char-counter'),
    tweetPreviewText: document.getElementById('tweet-preview-text'),
    tweetBtn: document.getElementById('tweet-btn')
};

// ==========================================================================
// Initialization & Event Listeners
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch
    fetchReleases();

    // Theme toggle
    initTheme();
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Refresh buttons
    elements.refreshBtn.addEventListener('click', fetchReleases);
    elements.retryBtn.addEventListener('click', fetchReleases);

    // Search events
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.clearSearch.addEventListener('click', handleClearSearch);

    // Filter events
    elements.categoryFiltersContainer.addEventListener('click', handleCategoryFilterClick);
    elements.resetFiltersBtn.addEventListener('click', handleResetFilters);

    // Composer text area input
    elements.tweetTextarea.addEventListener('input', handleTweetTextareaInput);

    // Tweet action
    elements.tweetBtn.addEventListener('click', handleTweetSubmit);

    // Export CSV action
    elements.exportCsvBtn.addEventListener('click', exportToCSV);
});

// ==========================================================================
// API Operations
// ==========================================================================
async function fetchReleases() {
    setLoading(true);
    
    try {
        const response = await fetch('/api/releases');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.status === 'error') {
            throw new Error(data.message);
        }
        
        state.releases = data.releases || [];
        
        // Reset selection if the loaded releases no longer contain the selected ID
        if (state.selectedReleaseId && !state.releases.some(r => r.id === state.selectedReleaseId)) {
            closeComposer();
        }
        
        filterAndRender();
        setErrorState(null);
    } catch (error) {
        console.error('Error fetching release notes:', error);
        setErrorState(error.message || 'Failed to fetch release notes from the server.');
    } finally {
        setLoading(false);
    }
}

// ==========================================================================
// State UI Handlers
// ==========================================================================
function setLoading(isLoading) {
    if (isLoading) {
        elements.refreshIcon.classList.add('spinning');
        elements.refreshBtn.classList.add('spinning');
        elements.loadingState.style.display = 'flex';
        elements.releasesContainer.style.display = 'none';
        elements.errorState.style.display = 'none';
        elements.emptyState.style.display = 'none';
        elements.resultsCount.textContent = 'Fetching updates...';
        elements.exportCsvBtn.style.display = 'none';
    } else {
        elements.refreshIcon.classList.remove('spinning');
        elements.refreshBtn.classList.remove('spinning');
        elements.loadingState.style.display = 'none';
    }
}

function setErrorState(errorMsg) {
    if (errorMsg) {
        elements.errorMessage.textContent = errorMsg;
        elements.errorState.style.display = 'flex';
        elements.releasesContainer.style.display = 'none';
        elements.emptyState.style.display = 'none';
        elements.resultsCount.textContent = 'Error loading releases';
        elements.exportCsvBtn.style.display = 'none';
    } else {
        elements.errorState.style.display = 'none';
    }
}

// ==========================================================================
// Search & Filter Logic
// ==========================================================================
function handleSearchInput(e) {
    state.searchQuery = e.target.value;
    
    // Toggle search clear button
    if (state.searchQuery.length > 0) {
        elements.clearSearch.style.display = 'block';
    } else {
        elements.clearSearch.style.display = 'none';
    }
    
    filterAndRender();
}

function handleClearSearch() {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.clearSearch.style.display = 'none';
    filterAndRender();
}

function handleCategoryFilterClick(e) {
    const filterTag = e.target.closest('.filter-tag');
    if (!filterTag) return;

    // Toggle active classes
    const tags = elements.categoryFiltersContainer.querySelectorAll('.filter-tag');
    tags.forEach(tag => tag.classList.remove('active'));
    filterTag.classList.add('active');

    state.categoryFilter = filterTag.dataset.category;
    filterAndRender();
}

function handleResetFilters() {
    // Reset search inputs
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.clearSearch.style.display = 'none';
    
    // Reset category filter UI
    const tags = elements.categoryFiltersContainer.querySelectorAll('.filter-tag');
    tags.forEach(tag => {
        if (tag.dataset.category === 'all') {
            tag.classList.add('active');
        } else {
            tag.classList.remove('active');
        }
    });
    state.categoryFilter = 'all';
    
    // Re-render
    filterAndRender();
}

function filterAndRender() {
    const query = state.searchQuery.toLowerCase().trim();
    const catFilter = state.categoryFilter.toLowerCase();
    
    state.filteredReleases = state.releases.filter(release => {
        // Category matching
        const relCat = release.category.toLowerCase();
        let matchesCategory = true;
        
        if (catFilter !== 'all') {
            if (catFilter === 'other') {
                // 'other' matches any category that is not standard
                matchesCategory = !['feature', 'issue', 'change', 'deprecated'].includes(relCat);
            } else {
                matchesCategory = relCat === catFilter;
            }
        }
        
        // Search text matching
        let matchesSearch = true;
        if (query) {
            matchesSearch = release.text_content.toLowerCase().includes(query) || 
                            release.category.toLowerCase().includes(query) || 
                            release.date.toLowerCase().includes(query);
        }
        
        return matchesCategory && matchesSearch;
    });

    renderReleasesList();
}

// ==========================================================================
// UI Rendering
// ==========================================================================
function renderReleasesList() {
    elements.releasesContainer.innerHTML = '';
    
    // Update results count
    const count = state.filteredReleases.length;
    elements.resultsCount.textContent = `Showing ${count} update${count === 1 ? '' : 's'}`;

    if (count === 0) {
        elements.releasesContainer.style.display = 'none';
        elements.emptyState.style.display = 'flex';
        elements.exportCsvBtn.style.display = 'none';
        return;
    }

    elements.releasesContainer.style.display = 'flex';
    elements.emptyState.style.display = 'none';
    elements.exportCsvBtn.style.display = 'inline-flex';

    state.filteredReleases.forEach(release => {
        const card = createReleaseCard(release);
        elements.releasesContainer.appendChild(card);
    });
}

function createReleaseCard(release) {
    const card = document.createElement('article');
    card.className = `release-card ${state.selectedReleaseId === release.id ? 'selected' : ''}`;
    card.dataset.id = release.id;
    
    const catLower = release.category.toLowerCase();
    let badgeClass = 'badge-other';
    if (['feature', 'issue', 'change', 'deprecated'].includes(catLower)) {
        badgeClass = `badge-${catLower}`;
    }
    
    const isSelected = state.selectedReleaseId === release.id;

    card.innerHTML = `
        <div class="card-header">
            <div class="card-meta">
                <span class="date-badge">${escapeHTML(release.date)}</span>
                <span class="badge ${badgeClass}">${escapeHTML(release.category)}</span>
            </div>
            <div class="card-actions">
                <button class="card-action-btn copy-btn" title="Copy text to clipboard">
                    <i class="fa-regular fa-copy"></i>
                </button>
                <div class="card-select-hint">
                    ${isSelected ? '<i class="fa-solid fa-circle-check"></i> Selected' : '<i class="fa-solid fa-plus"></i> Select to Tweet'}
                </div>
            </div>
        </div>
        <div class="card-content">
            ${release.html_content}
        </div>
    `;

    // Click handler to select card
    card.addEventListener('click', () => {
        selectRelease(release.id);
    });

    // Copy handler
    const copyBtn = card.querySelector('.copy-btn');
    copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(release.text_content, copyBtn);
    });

    return card;
}

// ==========================================================================
// Card Selection & Tweet Composer Logic
// ==========================================================================
function selectRelease(id) {
    state.selectedReleaseId = id;
    
    // Update active visual classes in releases list
    const cards = elements.releasesContainer.querySelectorAll('.release-card');
    cards.forEach(card => {
        if (card.dataset.id === id) {
            card.classList.add('selected');
            const hint = card.querySelector('.card-select-hint');
            if (hint) hint.innerHTML = '<i class="fa-solid fa-circle-check"></i> Selected';
        } else {
            card.classList.remove('selected');
            const hint = card.querySelector('.card-select-hint');
            if (hint) hint.innerHTML = '<i class="fa-solid fa-plus"></i> Select to Tweet';
        }
    });

    // Populate and open composer
    const release = state.releases.find(r => r.id === id);
    if (release) {
        setupComposer(release);
    }
}

function closeComposer() {
    state.selectedReleaseId = null;
    elements.composerActive.style.display = 'none';
    elements.composerEmpty.style.display = 'flex';
}

function setupComposer(release) {
    elements.composerEmpty.style.display = 'none';
    elements.composerActive.style.display = 'flex';

    // Generate Twitter Draft
    const catLower = release.category.toLowerCase();
    const meta = CATEGORY_TWEET_METADATA[catLower] || CATEGORY_TWEET_METADATA['update'];
    
    const prefix = `${meta.label} (${release.date}): `;
    const suffix = `${meta.tags}`;
    const link = ` ${release.link}`;
    
    // Calculate space for details text:
    // Max length is 280. URLs count as 23 characters.
    const urlLength = 23;
    const reservedLength = prefix.length + suffix.length + urlLength + 5; // +5 for formatting spacing/ellipsis
    const maxTextLength = 280 - reservedLength;
    
    let plainText = release.text_content;
    if (plainText.length > maxTextLength) {
        plainText = plainText.substring(0, maxTextLength).trim() + '...';
    }
    
    const defaultTweet = `${prefix}${plainText}${suffix}${link}`;
    
    // Populate text area
    elements.tweetTextarea.value = defaultTweet;
    
    // Update live preview & character counter
    updateTweetStats();
    
    // Scroll composer into view on mobile
    if (window.innerWidth <= 1024) {
        elements.composerActive.scrollIntoView({ behavior: 'smooth' });
    }
}

function handleTweetTextareaInput() {
    updateTweetStats();
}

function updateTweetStats() {
    const text = elements.tweetTextarea.value;
    
    // Update live preview (highlighting links could be nice, but simple text is good)
    elements.tweetPreviewText.textContent = text;
    
    // Precise Twitter/X length calculation
    const remaining = calculateTwitterRemainingChars(text);
    
    // Render counter
    elements.charCounter.textContent = remaining;
    
    // Style counter and handle button states
    elements.charCounter.className = 'char-counter';
    if (remaining < 0) {
        elements.charCounter.classList.add('danger');
        elements.tweetBtn.disabled = true;
        elements.tweetBtn.style.opacity = '0.5';
        elements.tweetBtn.style.cursor = 'not-allowed';
    } else {
        elements.tweetBtn.disabled = false;
        elements.tweetBtn.style.opacity = '1';
        elements.tweetBtn.style.cursor = 'pointer';
        
        if (remaining < 20) {
            elements.charCounter.classList.add('warning');
        }
    }
}

/**
 * Calculates remaining characters using X's standard (all URLs cost 23 characters)
 */
function calculateTwitterRemainingChars(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Replace all URLs with 23 characters
    let parsedText = text.replace(urlRegex, () => {
        return "x".repeat(23);
    });
    
    return 280 - parsedText.length;
}

function handleTweetSubmit() {
    const tweetText = elements.tweetTextarea.value;
    if (!tweetText.trim()) return;
    
    if (calculateTwitterRemainingChars(tweetText) < 0) {
        alert("Your Tweet exceeds the 280-character limit.");
        return;
    }
    
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
}

// ==========================================================================
// Helper Functions
// ==========================================================================
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function copyToClipboard(text, buttonElement) {
    navigator.clipboard.writeText(text).then(() => {
        const icon = buttonElement.querySelector('i');
        icon.className = 'fa-solid fa-check';
        buttonElement.classList.add('copied');
        buttonElement.title = 'Copied!';
        
        setTimeout(() => {
            icon.className = 'fa-regular fa-copy';
            buttonElement.classList.remove('copied');
            buttonElement.title = 'Copy text to clipboard';
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Could not copy text to clipboard.');
    });
}

function exportToCSV() {
    if (state.filteredReleases.length === 0) return;
    
    const headers = ['Date', 'Category', 'Text Content', 'Documentation URL'];
    const rows = state.filteredReleases.map(release => [
        release.date,
        release.category,
        release.text_content,
        release.link
    ]);
    
    const escapeCSVField = (field) => {
        if (field === null || field === undefined) return '""';
        const stringified = String(field);
        if (stringified.includes('"') || stringified.includes(',') || stringified.includes('\n') || stringified.includes('\r')) {
            return `"${stringified.replace(/"/g, '""')}"`;
        }
        return stringified;
    };
    
    const csvContent = [
        headers.map(escapeCSVField).join(','),
        ...rows.map(row => row.map(escapeCSVField).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    let filename = 'bigquery_release_notes';
    if (state.categoryFilter !== 'all') {
        filename += `_${state.categoryFilter}`;
    }
    if (state.searchQuery) {
        filename += '_filtered';
    }
    filename += '.csv';
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light-theme');
        elements.themeIcon.className = 'fa-solid fa-moon';
        elements.themeToggleBtn.title = 'Switch to Dark Mode';
    } else {
        document.documentElement.classList.remove('light-theme');
        elements.themeIcon.className = 'fa-solid fa-sun';
        elements.themeToggleBtn.title = 'Switch to Light Mode';
    }
}

function toggleTheme() {
    const isLight = document.documentElement.classList.toggle('light-theme');
    if (isLight) {
        localStorage.setItem('theme', 'light');
        elements.themeIcon.className = 'fa-solid fa-moon';
        elements.themeToggleBtn.title = 'Switch to Dark Mode';
    } else {
        localStorage.setItem('theme', 'dark');
        elements.themeIcon.className = 'fa-solid fa-sun';
        elements.themeToggleBtn.title = 'Switch to Light Mode';
    }
}
