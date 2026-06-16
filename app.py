import os
import re
from flask import Flask, render_template, jsonify
import feedparser
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_whitespace(text):
    # Replace multiple spaces/newlines with a single space
    return re.sub(r'\s+', ' ', text).strip()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        # Fetch XML from URL
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(FEED_URL, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse XML feed
        feed = feedparser.parse(response.text)
        
        releases = []
        
        for entry in feed.entries:
            # Entry Title (often the Date of release)
            entry_title = entry.get('title', 'Unknown Date')
            entry_link = entry.get('link', 'https://cloud.google.com/bigquery/docs/release-notes')
            entry_updated = entry.get('updated', '')
            
            # Content parsing
            content_html = ""
            if 'content' in entry:
                content_html = entry.content[0].value
            elif 'summary' in entry:
                content_html = entry.summary
                
            if not content_html:
                continue
                
            soup = BeautifulSoup(content_html, 'html.parser')
            
            # Group entries by <h3> tag (category)
            current_category = None
            current_elements = []
            entry_updates = []
            
            for child in soup.contents:
                # Check if this child is an h3 Tag
                if hasattr(child, 'name') and child.name == 'h3':
                    # Save previous category group if we have one
                    if current_category and current_elements:
                        html_val = "".join(str(e) for e in current_elements)
                        text_val = clean_whitespace("".join(e.get_text() if hasattr(e, 'get_text') else str(e) for e in current_elements))
                        entry_updates.append((current_category, html_val, text_val))
                    
                    current_category = child.get_text().strip()
                    current_elements = []
                else:
                    if current_category:
                        current_elements.append(child)
                    else:
                        # Elements before first h3 are treated as part of a default 'Update' category
                        current_elements.append(child)
            
            # Add the final group
            if current_category and current_elements:
                html_val = "".join(str(e) for e in current_elements)
                text_val = clean_whitespace("".join(e.get_text() if hasattr(e, 'get_text') else str(e) for e in current_elements))
                entry_updates.append((current_category, html_val, text_val))
            elif not current_category and current_elements:
                # No <h3> tags were found at all
                html_val = "".join(str(e) for e in current_elements)
                text_val = clean_whitespace(soup.get_text())
                entry_updates.append(('Update', html_val, text_val))
                
            # If no updates were collected, push the entire soup
            if not entry_updates:
                entry_updates.append(('Update', content_html, clean_whitespace(soup.get_text())))
                
            # Convert to list of dicts with unique IDs
            for i, (cat, html_val, text_val) in enumerate(entry_updates):
                # Clean up empty elements or whitespace-only
                if not text_val.strip():
                    continue
                
                unique_id = f"{entry.get('id', entry_title)}_{i}"
                
                releases.append({
                    'id': unique_id,
                    'date': entry_title,
                    'updated_iso': entry_updated,
                    'category': cat,
                    'html_content': html_val,
                    'text_content': text_val,
                    'link': entry_link
                })
                
        return jsonify({
            'status': 'success',
            'releases': releases
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
