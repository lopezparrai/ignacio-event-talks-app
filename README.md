# BigQuery Release Notes Explorer

A modern, responsive web application built with **Python Flask** on the backend and **Vanilla HTML, JavaScript, and CSS** on the frontend. It fetches, categorizes, and displays Google Cloud BigQuery release notes and provides an interactive interface to select, draft, and share updates on X (Twitter).

👉 **Live Demo (Local):** [http://127.0.0.1:5000](http://127.0.0.1:5000) (when running locally)

---

## 🌟 Key Features

* **Smart Atom Feed Parser**: Dynamically pulls live updates from the official Google Cloud BigQuery release feed.
* **Granular Release Splitting**: Google groups all updates of a single day into a single RSS entry. The backend automatically splits these entries by their subheadings (`<h3>`) into separate, focused cards (e.g. *Features*, *Issues*, *Deprecations*, *Changes*).
* **Premium Tech Aesthetics**: Designed with a sleek, responsive dark mode matching Google Cloud console colors, smooth hover micro-animations, and animated loading/refresh spinners.
* **Instant Filter & Search**: Instantly filter updates by category tags (Features, Issues, Changes, Deprecations) and search content using keywords in real-time.
* **X (Twitter) Draft Composer**:
  * Selecting a release card auto-populates a sticky Tweet composer with a customizable prefilled layout.
  * Features a **Twitter-accurate character counter** that counts any URL as exactly 23 characters (according to X's URL shortening standard).
  * Includes a live-rendering mock tweet bubble preview with styled domain link cards.

---

## 📂 Project Structure

```text
bq-releases-notes/
├── app.py                  # Flask application entrypoint & RSS scraper
├── requirements.txt        # Python dependencies
├── .gitignore              # Git ignore rules for virtual environments & system cache
├── README.md               # Project documentation
├── templates/
│   └── index.html          # Main HTML structure with semantic elements
└── static/
    ├── css/
    │   └── style.css       # Custom dark theme stylesheet & responsive layouts
    └── js/
        └── app.js          # Main client-side routing, filtering, and composer logic
```

---

## 🚀 Installation & Local Setup

### Prerequisites
Make sure you have Python 3.8+ and Git installed on your system.

### 1. Clone the Repository
```bash
git clone https://github.com/lopezparrai/ignacio-event-talks-app.git
cd ignacio-event-talks-app
```

### 2. Set Up a Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
python app.py
```
After starting, the local development server will be listening at **`http://127.0.0.1:5000`**. Open this URL in your web browser.

---

## 🛠️ Built With

* **Backend**:
  * [Flask](https://flask.palletsprojects.com/) - Python web framework
  * [feedparser](https://github.com/kurtmckee/feedparser) - RSS/Atom XML feed parsing
  * [BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup/) - HTML parsing and categorization
  * [requests](https://requests.readthedocs.io/) - HTTP client requests
* **Frontend**:
  * HTML5 (Semantic Structure)
  * CSS3 (Vanilla design tokens, flexbox/grid layout, custom animations)
  * Vanilla ES6 JavaScript (Asynchronous requests, DOM manipulation)
  * [FontAwesome](https://fontawesome.com/) - Vector icons

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
