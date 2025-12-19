import os
import sys
import json
from datetime import datetime, timedelta
from functools import wraps
from flask import abort
import hashlib
from werkzeug.utils import secure_filename
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, request, session, jsonify, render_template_string, redirect, url_for, render_template, make_response

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Admin configuration
# Store the hashed admin password (SHA-256)
ADMIN_PASSWORD_HASH = "d9faee09e8b5af1d37143292700818f7a954b360e5941470cdc9c59c5ca3a76b"  # placeholder, will set real hash below
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
VISITORS_FILE = os.path.join(DATA_DIR, 'visitors.json')
PROJECTS_FILE = os.path.join(DATA_DIR, 'projects.json')
SKILLS_FILE = os.path.join(DATA_DIR, 'skills.json')
CATEGORIES_FILE = os.path.join(DATA_DIR, 'categories.json')
SKILL_CATEGORIES_FILE = os.path.join(DATA_DIR, 'skill_categories.json')
CONFIG_FILE = os.path.join(DATA_DIR, 'config.json')
ABOUT_FILE = os.path.join(DATA_DIR, 'about.json')
CONTACT_FILE = os.path.join(DATA_DIR, 'contact.json')
CERTIFICATIONS_FILE = os.path.join(DATA_DIR, 'certifications.json')
CERTIFICATION_CATEGORIES_FILE = os.path.join(DATA_DIR, 'certification_categories.json')

# Create data directory if it doesn't exist
os.makedirs(DATA_DIR, exist_ok=True)

# Initialize data files if they don't exist
def init_data_files():
    if not os.path.exists(VISITORS_FILE):
        with open(VISITORS_FILE, 'w') as f:
            json.dump([], f)
    
    if not os.path.exists(PROJECTS_FILE):
        default_projects = [
            {
                "id": 1,
                "title": "Done Today",
                "description": "Track what you achieve every day. One thing at a time.",
                "category": "web",
                "tags": ["NextJS", "React", "TypeScript", "TailwindCSS", "MongoDB"],
                "github_url": "#",
                "mockup_type": "web",
                "mockup_content": {
                    "title": "Daily Clarity",
                    "description": "Done-Today helps you stay consistent with one meaningful action every day. Build streaks, feel clarity, and track your growth.",
                    "subtitle": "Small steps lead to big changes."
                }
            },
            {
                "id": 2,
                "title": "PostalMapper",
                "description": "A digital address card generator based on postal code with QR support, export options. Built with React & Tailwind.",
                "category": "web",
                "tags": ["React", "TailwindCSS", "QRCode"],
                "github_url": "#",
                "mockup_type": "web",
                "mockup_content": {
                    "title": "Find Postal Details",
                    "description": "Search by City or Postal Code",
                    "buttons": ["Search by City", "Search by Postal Code"]
                }
            },
            {
                "id": 3,
                "title": "Android-Sysinfo",
                "description": "A tool that efficiently displays Android system details.",
                "category": "cli",
                "tags": ["Linux", "Termux", "Android"],
                "github_url": "#",
                "mockup_type": "terminal",
                "mockup_content": {
                    "commands": [
                        "$ android-sysinfo",
                        "System Information:",
                        "Device: Android"
                    ]
                }
            }
        ]
        with open(PROJECTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_projects, f, indent=2)
    
    if not os.path.exists(SKILLS_FILE):
        default_skills = [
            {"id": 1, "name": "React", "icon": "code", "category": "frontend"},
            {"id": 2, "name": "Node.js", "icon": "server", "category": "backend"},
            {"id": 3, "name": "MongoDB", "icon": "database", "category": "database"},
            {"id": 4, "name": "Tailwind CSS", "icon": "palette", "category": "frontend"},
            {"id": 5, "name": "TypeScript", "icon": "code", "category": "language"},
            {"id": 6, "name": "Git & GitHub", "icon": "git-branch", "category": "tools"},
            {"id": 7, "name": "Next.js", "icon": "link", "category": "frontend"},
            {"id": 8, "name": "Python", "icon": "link", "category": "language"}
        ]
        with open(SKILLS_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_skills, f, indent=2)
    
    if not os.path.exists(CATEGORIES_FILE):
        default_categories = [
            {"id": 1, "name": "Web"},
            {"id": 2, "name": "CLI"},
            {"id": 3, "name": "Mobile"},
            {"id": 4, "name": "Desktop"}
        ]
        with open(CATEGORIES_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_categories, f, indent=2)
    
    # Initialize skill categories if not exists
    if not os.path.exists(SKILL_CATEGORIES_FILE):
        default_skill_categories = [
            {"id": 1, "name": "FrontEnd"},
            {"id": 2, "name": "BackEnd"},
            {"id": 3, "name": "Database"},
            {"id": 4, "name": "Tools"},
            {"id": 5, "name": "IT"},
            {"id": 6, "name": "Testing"}
        ]
        with open(SKILL_CATEGORIES_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_skill_categories, f, indent=2)
    
    if not os.path.exists(CONFIG_FILE):
        default_config = {
            "logo_text": "Portfolio",
            "profile_image": "profile.jpg",
            "about_text": "Welcome to my portfolio! This is a brief introduction about myself.",
            "contact_text": "Feel free to reach out to me at myemail@example.com",
            "project_sort_by": "date",
            "show_all_category_filter": False
        }
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, indent=2)
            
    if not os.path.exists(CERTIFICATIONS_FILE):
        with open(CERTIFICATIONS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, indent=2)
            
    if not os.path.exists(CERTIFICATION_CATEGORIES_FILE):
        default_cert_categories = [
            {"id": 1, "name": "IT"},
            {"id": 2, "name": "Testing"},
            {"id": 3, "name": "Security"},
            {"id": 4, "name": "DevOps"}
        ]
        with open(CERTIFICATION_CATEGORIES_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_cert_categories, f, indent=2)

init_data_files()

# Visitor tracking middleware
@app.before_request
def track_visitor():
    # This is handled by the new /api/track_visit endpoint
    pass

# Admin authentication decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

def verify_admin_password(password):
    return hashlib.sha256(password.encode()).hexdigest() == ADMIN_PASSWORD_HASH

# Admin routes
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        password = request.form.get('password')
        if verify_admin_password(password):
            session['admin_logged_in'] = True
            return redirect(url_for('admin_dashboard'))
        else:
            return render_template('admin_login.html', error="Invalid password")
    
    return render_template('admin_login.html')

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin_login'))

@app.route('/admin')
@admin_required
def admin_dashboard():
    return render_template('admin_dashboard.html')

@app.route('/admin/home', methods=['GET', 'POST'])
@admin_required
def admin_home():
    config_path = os.path.join(DATA_DIR, 'config.json')
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        config = {}
    
    if request.method == 'POST':
        config['logo_text'] = request.form.get('logo_text')
        config['hero_title'] = request.form.get('hero_title')
        # Support both dynamic list and comma-separated input for hero_subtitle
        hero_subtitles = request.form.getlist('hero_subtitle')
        if not hero_subtitles or (len(hero_subtitles) == 1 and not hero_subtitles[0].strip()):
            # fallback to comma-separated input (if any)
            hero_subtitles = [s.strip() for s in request.form.get('hero_subtitle', '').split(',') if s.strip()]
        config['hero_subtitle'] = [s for s in hero_subtitles if s.strip()]
        config['location'] = request.form.get('location')
        
        # Handle profile image upload
        if 'profile_image' in request.files and request.files['profile_image'].filename:
            file = request.files['profile_image']
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.static_folder, filename)
            file.save(file_path)
            config['profile_image'] = filename
            config['profile_image_url'] = '' # Clear URL if file is uploaded
        else:
            # Handle profile image URL
            profile_image_url = request.form.get('profile_image_url')
            if profile_image_url:
                config['profile_image_url'] = profile_image_url
                config['profile_image'] = '' # Clear file if URL is provided
        
        # Category filter UI option
        # Checkbox sends value only when checked
        config['show_all_category_filter'] = bool(request.form.get('show_all_category_filter'))

        # Handle social links
        social_icons = request.form.getlist('social_link_icon')
        social_urls = request.form.getlist('social_link_url')
        social_titles = request.form.getlist('social_link_title')
        
        config['social_links'] = []
        for icon, url, title in zip(social_icons, social_urls, social_titles):
            if icon and url and title:
                config['social_links'].append({'icon': icon, 'url': url, 'title': title})

        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2)
            
        return redirect(url_for('admin_home'))
        
    return render_template('admin_home.html', config=config)

@app.route('/admin/about', methods=['GET', 'POST'])
@admin_required
def admin_about():
    about_path = os.path.join(DATA_DIR, 'about.json')
    try:
        with open(about_path, 'r', encoding='utf-8') as f:
            about_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        about_data = {'description': '', 'tags': [], 'timeline': []}

    if request.method == 'POST':
        about_data['description'] = request.form.get('description')
        about_data['tags'] = [tag.strip() for tag in request.form.get('tags', '').split(',') if tag.strip()]
        
        timeline_years = request.form.getlist('timeline_year')
        timeline_contents = request.form.getlist('timeline_content')
        
        about_data['timeline'] = []
        for year, content in zip(timeline_years, timeline_contents):
            if year and content:
                about_data['timeline'].append({'year': year, 'content': content})
        
        with open(about_path, 'w', encoding='utf-8') as f:
            json.dump(about_data, f, indent=4)
            
        return redirect(url_for('admin_about'))

    return render_template('admin_about.html', about_data=about_data)

@app.route('/admin/contact', methods=['GET', 'POST'])
@admin_required
def admin_contact():
    contact_path = os.path.join(DATA_DIR, 'contact.json')
    try:
        with open(contact_path, 'r', encoding='utf-8') as f:
            contact_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        contact_data = {'description': '', 'items': []}

    if request.method == 'POST':
        contact_data['description'] = request.form.get('description')
        
        icons = request.form.getlist('contact_icon')
        texts = request.form.getlist('contact_text')
        links = request.form.getlist('contact_link')
        
        contact_data['items'] = []
        for icon, text, link in zip(icons, texts, links):
            if icon and text and link:
                contact_data['items'].append({'icon': icon, 'text': text, 'link': link})
        
        with open(contact_path, 'w', encoding='utf-8') as f:
            json.dump(contact_data, f, indent=4)
            
        return redirect(url_for('admin_contact'))

    return render_template('admin_contact.html', contact_data=contact_data)

@app.route('/admin/visitors')
@admin_required
def admin_visitors():
    try:
        with open(VISITORS_FILE, 'r') as f:
            visitors = json.load(f)
    except:
        visitors = []
    
    # Calculate analytics
    total_visits = len(visitors)
    unique_ips = len(set(visitor.get('ip', '') for visitor in visitors))
    page_views = len([v for v in visitors if v.get('method') == 'GET' and not v.get('path', '').endswith('.ico')])
    
    # Get recent visitors (last 50)
    recent_visitors = visitors[-50:] if len(visitors) > 50 else visitors
    
    # Calculate top pages
    page_counts = {}
    for visitor in visitors:
        path = visitor.get('path', '')
        if not path.endswith('.ico') and not path.startswith('/admin'):
            page_counts[path] = page_counts.get(path, 0) + 1
    
    top_pages = sorted(page_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Calculate hourly visits for today
    today = datetime.now().date()
    hourly_visits = {}
    for visitor in visitors:
        try:
            visit_time = datetime.fromisoformat(visitor.get('timestamp', ''))
            if visit_time.date() == today:
                hour = visit_time.hour
                hourly_visits[hour] = hourly_visits.get(hour, 0) + 1
        except:
            continue
    
    analytics = {
        'total_visits': total_visits,
        'unique_ips': unique_ips,
        'page_views': page_views,
        'top_pages': top_pages,
        'hourly_visits': hourly_visits
    }
    
    return render_template('visitor_analytics.html', visitors=recent_visitors, analytics=analytics)

@app.route('/admin/visitors/clear', methods=['POST'])
@admin_required
def clear_visitors():
    try:
        with open(VISITORS_FILE, 'w') as f:
            json.dump([], f)
        return jsonify({"success": True, "message": "Visitor logs cleared successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/admin/visitors/export')
@admin_required
def export_visitors():
    try:
        with open(VISITORS_FILE, 'r') as f:
            visitors = json.load(f)
        
        # Create CSV content
        csv_content = "IP Address,Timestamp,Path,Method,User Agent\n"
        for visitor in visitors:
            csv_content += f"{visitor.get('ip', '')},{visitor.get('timestamp', '')},{visitor.get('path', '')},{visitor.get('method', '')},{visitor.get('user_agent', '').replace(',', ';')}\n"
        
        from flask import Response
        return Response(
            csv_content,
            mimetype="text/csv",
            headers={"Content-disposition": f"attachment; filename=visitors_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
        )
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/admin/projects')
@admin_required
def admin_projects():
    sort_by = request.args.get('sort_by', None)
    config_path = os.path.join(DATA_DIR, 'config.json')

    # Load config
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except Exception:
        config = {"project_sort_by": "date", "admin_project_sort_by": "manual"}

    # Admin projects page has its own sort mode so that manual reordering is possible
    # without affecting the public site projects sorting.
    if sort_by:
        config['admin_project_sort_by'] = sort_by
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
    else:
        sort_by = (config.get('admin_project_sort_by') or 'manual').strip().lower()

    # Load projects
    try:
        with open(PROJECTS_FILE, 'r') as f:
            projects = json.load(f)
    except Exception:
        projects = []

    # Sort projects by selected field (this defines the per-category order too)
    # manual => keep file order, so move actions are reflected immediately
    if sort_by == 'id':
        projects.sort(key=lambda p: int(p.get('id', 0)))
    elif sort_by == 'date':
        projects.sort(key=lambda p: p.get('date', ''), reverse=True)
    else:
        sort_by = 'manual'

    # Load categories in admin-defined order
    try:
        with open(CATEGORIES_FILE, 'r', encoding='utf-8') as f:
            categories = json.load(f)
    except Exception:
        categories = []

    category_order = [c.get('name') for c in categories if c.get('name')]
    category_set = set(category_order)

    # Add any categories that exist on projects but are missing from categories.json
    extra_categories = []
    for p in projects:
        cat = p.get('category')
        if cat and cat not in category_set and cat not in extra_categories:
            extra_categories.append(cat)

    grouped = []
    for cat_name in category_order + extra_categories:
        grouped.append({
            'category': cat_name,
            'projects': [p for p in projects if p.get('category') == cat_name]
        })

    # Edge case: no categories configured and/or projects with empty category
    if not grouped and projects:
        grouped.append({'category': 'Uncategorized', 'projects': projects})

    return render_template('admin_projects.html', grouped_projects=grouped, projects=projects, admin_sort_by=sort_by)

@app.route('/admin/projects/add', methods=['GET', 'POST'])
@admin_required
def add_project():
    if request.method == 'POST':
        try:
            # Load existing projects
            try:
                with open(PROJECTS_FILE, 'r') as f:
                    projects = json.load(f)
            except:
                projects = []
            # Get form data
            data = request.get_json() if request.is_json else request.form
            # Get ID from form if provided, else generate new
            form_id = data.get('id')
            try:
                form_id = int(form_id) if form_id not in (None, '', 'None') else None
            except:
                form_id = None
            # Check for duplicate IDs
            used_ids = set(p.get('id') for p in projects if p.get('id'))
            if form_id and form_id in used_ids:
                error_msg = f"Project ID {form_id} is already used. Please choose a unique ID or leave empty for auto."
                with open(CATEGORIES_FILE, 'r') as f:
                    categories = json.load(f)
                return render_template('add_project.html', categories=categories, error=error_msg, form=data)
            else:
                new_id = form_id if form_id else (max([p.get('id', 0) for p in projects], default=0) + 1)
            # Process mockup content
            mockup_content = data.get('mockup_content', '')
            try:
                mockup_content = validate_mockup_content(mockup_content)
            except Exception as e:
                error_msg = f"Invalid content format: {e}"
                if request.is_json:
                    return jsonify({"success": False, "message": error_msg}), 400
                else:
                    with open(CATEGORIES_FILE, 'r') as f:
                        categories = json.load(f)
                    return render_template('add_project.html', categories=categories, error=error_msg, form=data)
            # Handle confidential and demo fields
            confidential = bool(data.get('confidential'))
            demo_url = data.get('demo_url', '')
            demo_button_text = data.get('demo_button_text', 'Demo')
            new_project = {
                "id": new_id,
                "title": data.get('title', ''),
                "description": data.get('description', ''),
                "category": data.get('category', 'web'),
                "tags": data.get('tags', '').split(',') if isinstance(data.get('tags'), str) else data.get('tags', []),
                "github_url": data.get('github_url', '#'),
                "link_button_text": data.get('link_button_text', 'GitHub'),
                "mockup_content": mockup_content,
                "date": data.get('date', datetime.now().strftime('%Y-%m-%d')),
                "demo_url": demo_url,
                "demo_button_text": demo_button_text,
                "confidential": confidential
            }
            # Clean tags
            new_project['tags'] = [tag.strip() for tag in new_project['tags'] if tag.strip()]
            # Add to projects list
            projects.append(new_project)
            # Save to file
            with open(PROJECTS_FILE, 'w') as f:
                json.dump(projects, f, indent=2)
            if request.is_json:
                return jsonify({"success": True, "message": "Project added successfully", "project": new_project})
            else:
                return redirect(url_for('admin_projects'))
        except Exception as e:
            if request.is_json:
                return jsonify({"success": False, "message": str(e)})
            else:
                return redirect(url_for('admin_projects'))
    # GET request - show add form
    try:
        with open(CATEGORIES_FILE, 'r') as f:
            categories = json.load(f)
    except:
        categories = []
    return render_template('add_project.html', categories=categories)

@app.route('/admin/projects/edit/<int:project_id>', methods=['GET', 'POST'])
@admin_required
def edit_project(project_id):
    try:
        with open(PROJECTS_FILE, 'r') as f:
            projects = json.load(f)
    except:
        projects = []
    
    # Find project
    project = next((p for p in projects if p.get('id') == project_id), None)
    if not project:
        if request.is_json:
            return jsonify({"success": False, "message": "Project not found"})
        else:
            return redirect(url_for('admin_projects'))
    
    if request.method == 'POST':
        try:
            data = request.get_json() if request.is_json else request.form
            
            # Process mockup content
            mockup_content = data.get('mockup_content', project.get('mockup_content', ''))
            try:
                mockup_content = validate_mockup_content(mockup_content)
            except Exception as e:
                error_msg = f"Invalid content format: {e}"
                if request.is_json:
                    return jsonify({"success": False, "message": error_msg}), 400
                else:
                    with open(CATEGORIES_FILE, 'r') as f:
                        categories = json.load(f)
                    return render_template('edit_project.html', project=project, categories=categories, error=error_msg, form=data)
                    
            # Allow changing ID, but handle duplicates
            form_id = data.get('id', project.get('id'))
            try:
                form_id = int(form_id) if form_id not in (None, '', 'None') else None
            except:
                form_id = None
            used_ids = set(p.get('id') for p in projects if p.get('id') and p != project)
            if form_id and form_id in used_ids:
                error_msg = f"Project ID {form_id} is already used. Please choose a unique ID or leave empty for auto."
                with open(CATEGORIES_FILE, 'r') as f:
                    categories = json.load(f)
                return render_template('edit_project.html', project=project, categories=categories, error=error_msg, form=data)
            else:
                new_id = form_id
            # Handle confidential and demo fields
            confidential = bool(data.get('confidential'))
            demo_url = data.get('demo_url', project.get('demo_url', ''))
            demo_button_text = data.get('demo_button_text', project.get('demo_button_text', 'Demo'))
            project.update({
                "id": new_id,
                "title": data.get('title', project.get('title', '')),
                "description": data.get('description', project.get('description', '')),
                "category": data.get('category', project.get('category', 'web')),
                "tags": data.get('tags', '').split(',') if isinstance(data.get('tags'), str) else data.get('tags', project.get('tags', [])),
                "github_url": data.get('github_url', project.get('github_url', '#')),
                "link_button_text": data.get('link_button_text', project.get('link_button_text', 'GitHub')),
                "mockup_content": mockup_content,
                "date": data.get('date', project.get('date', datetime.now().strftime('%Y-%m-%d'))),
                "demo_url": demo_url,
                "demo_button_text": demo_button_text,
                "confidential": confidential
            })
            project['tags'] = [tag.strip() for tag in project['tags'] if tag.strip()]
            with open(PROJECTS_FILE, 'w') as f:
                json.dump(projects, f, indent=2)
            if request.is_json:
                return jsonify({"success": True, "message": "Project updated successfully", "project": project})
            else:
                return redirect(url_for('admin_projects'))
        except Exception as e:
            if request.is_json:
                return jsonify({"success": False, "message": str(e)})
            else:
                return redirect(url_for('admin_projects'))
    # GET request - show edit form
    try:
        with open(CATEGORIES_FILE, 'r') as f:
            categories = json.load(f)
    except:
        categories = []
    return render_template('edit_project.html', project=project, categories=categories)

@app.route('/admin/projects/delete/<int:project_id>', methods=['POST'])
@admin_required
def delete_project(project_id):
    try:
        with open(PROJECTS_FILE, 'r') as f:
            projects = json.load(f)
    except:
        projects = []

    # Find and remove project
    projects = [p for p in projects if p.get('id') != project_id]

    # Keep project IDs stable (do not re-index globally).
    # Reordering is handled separately via list order / per-category swaps.

    # Save to file
    with open(PROJECTS_FILE, 'w') as f:
        json.dump(projects, f, indent=2)

    return jsonify({"success": True, "message": "Project deleted successfully"})


@app.route('/admin/projects/move', methods=['POST'])
@admin_required
def move_project():
    """Move a project up/down by swapping its position in projects.json.

    Important: reordering is *per-category* and should not impact projects in other categories.
    Also, the swap should follow the same ordering the admin UI is showing (based on current sort).
    """
    try:
        with open(PROJECTS_FILE, 'r') as f:
            projects = json.load(f)
    except Exception:
        projects = []

    # Determine current admin sort (same logic as admin_projects)
    config_path = os.path.join(DATA_DIR, 'config.json')
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except Exception:
        config = {"admin_project_sort_by": "manual"}
    sort_by = (config.get('admin_project_sort_by') or 'manual').strip().lower()

    try:
        project_id = int(request.form.get('id'))
    except (TypeError, ValueError):
        project_id = None

    direction = (request.form.get('direction') or '').strip().lower()

    def _pid(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    def _cat(p):
        return (p.get('category') or '').strip().lower()

    # Build the list of indices in the same order shown in the admin page.
    indices = list(range(len(projects)))
    if sort_by == 'id':
        indices.sort(key=lambda i: int(projects[i].get('id', 0)))
    elif sort_by == 'date':
        indices.sort(key=lambda i: projects[i].get('date', ''), reverse=True)
    else:
        sort_by = 'manual'
    if project_id is not None:
        current_index = next((i for i in indices if _pid(projects[i].get('id')) == project_id), None)
        if current_index is not None:
            current_category = _cat(projects[current_index])

            # Support UI directions: left/right (preferred) and up/down (legacy)
            if direction in ('left', 'up'):
                prev_index = next((i for i in reversed(indices[:indices.index(current_index)])
                                  if _cat(projects[i]) == current_category), None)
                if prev_index is not None:
                    projects[prev_index], projects[current_index] = projects[current_index], projects[prev_index]
            elif direction in ('right', 'down'):
                next_index = next((i for i in indices[indices.index(current_index) + 1:]
                                  if _cat(projects[i]) == current_category), None)
                if next_index is not None:
                    projects[next_index], projects[current_index] = projects[current_index], projects[next_index]

    # Keep project IDs stable (do not re-index globally).
    # This prevents moves in one category from affecting IDs in other categories.
    with open(PROJECTS_FILE, 'w') as f:
        json.dump(projects, f, indent=2)

    # Ensure the public site reflects the manual order after a move.
    # (Public /api/projects uses config['project_sort_by'].)
    try:
        config_path = os.path.join(DATA_DIR, 'config.json')
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
        except Exception:
            config = {}
        config['project_sort_by'] = 'manual'
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
    except Exception:
        pass

    return redirect(url_for('admin_projects'), code=303)

@app.route('/admin/projects/categories')
@admin_required
def get_project_categories():
    try:
        with open(PROJECTS_FILE, 'r') as f:
            projects = json.load(f)
        
        # Get unique categories
        categories = list(set(p.get('category', 'web') for p in projects))
        return jsonify({"success": True, "categories": categories})
    except:
        return jsonify({"success": True, "categories": ["web", "cli"]})

@app.route('/admin/skills')
@admin_required
def admin_skills():
    try:
        with open(SKILLS_FILE, 'r') as f:
            skills = json.load(f)
    except:
        skills = []
    
    try:
        with open(SKILL_CATEGORIES_FILE, 'r') as f:
            skill_categories = json.load(f)
    except:
        skill_categories = []
        
    return render_template('admin_skills.html', skills=skills, skill_categories=skill_categories)

@app.route('/admin/skills/add', methods=['GET'])
@admin_required
def add_skill():
    try:
        with open(SKILL_CATEGORIES_FILE, 'r') as f:
            skill_categories = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        skill_categories = []
    
    return render_template('add_skill.html', skill_categories=skill_categories)

@app.route('/admin/skills/edit/<int:skill_id>')
@admin_required
def edit_skill(skill_id):
    try:
        with open(SKILLS_FILE, 'r') as f:
            skills = json.load(f)
        
        skill = next((s for s in skills if s.get('id') == skill_id), None)
        if not skill:
            return "Skill not found", 404
            
        try:
            with open(SKILL_CATEGORIES_FILE, 'r') as f:
                skill_categories = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            skill_categories = []
            
        return render_template('edit_skill.html', skill=skill, skill_categories=skill_categories)
    except:
        return "Error loading skill", 500

@app.route('/admin/skills/create', methods=['POST'])
@admin_required
def create_skill():
    try:
        with open(SKILLS_FILE, 'r') as f:
            skills = json.load(f)
    except:
        skills = []
    
    new_skill = {
        'id': max([s.get('id', 0) for s in skills], default=0) + 1,
        'name': request.form.get('name'),
        'category': request.form.get('category'),
        'icon': request.form.get('icon', '⚡')
    }
    
    skills.append(new_skill)
    
    with open(SKILLS_FILE, 'w') as f:
        json.dump(skills, f, indent=2)
    
    return redirect('/admin/skills')

@app.route('/admin/skills/update/<int:skill_id>', methods=['POST'])
@admin_required
def update_skill(skill_id):
    try:
        with open(SKILLS_FILE, 'r') as f:
            skills = json.load(f)
    except:
        skills = []
    
    for i, skill in enumerate(skills):
        if skill.get('id') == skill_id:
            skills[i] = {
                'id': skill_id,
                'name': request.form.get('name'),
                'category': request.form.get('category'),
                'icon': request.form.get('icon', '⚡')
            }
            break
    
    with open(SKILLS_FILE, 'w') as f:
        json.dump(skills, f, indent=2)
    
    return redirect('/admin/skills')

@app.route('/admin/skills/delete/<int:skill_id>', methods=['POST'])
@admin_required
def delete_skill(skill_id):
    try:
        with open(SKILLS_FILE, 'r') as f:
            skills = json.load(f)
    except:
        skills = []
    
    skills = [s for s in skills if s.get('id') != skill_id]
    
    with open(SKILLS_FILE, 'w') as f:
        json.dump(skills, f, indent=2)
    
    return jsonify({"success": True, "message": "Skill deleted successfully"})

@app.route('/admin/skills/reorder', methods=['POST'])
@admin_required
def admin_skills_reorder():
    data = request.json
    if not data or 'skill_ids' not in data:
        return jsonify({"success": False, "message": "Missing skill_ids"}), 400
    
    skill_ids = data['skill_ids']
    try:
        with open(SKILLS_FILE, 'r') as f:
            skills = json.load(f)
    except:
        return jsonify({"success": False, "message": "Could not load skills"}), 500
    
    # Map skills by ID
    skills_map = {s['id']: s for s in skills}
    
    # Create new ordered list
    ordered_skills = []
    for sid in skill_ids:
        if sid in skills_map:
            ordered_skills.append(skills_map[sid])
            
    # Add any skills that weren't in the ID list (just in case)
    remaining_ids = set(skills_map.keys()) - set(skill_ids)
    for rid in remaining_ids:
        ordered_skills.append(skills_map[rid])
    
    # Re-index IDs to match the new order
    for index, skill in enumerate(ordered_skills):
        skill['id'] = index + 1
        
    with open(SKILLS_FILE, 'w') as f:
        json.dump(ordered_skills, f, indent=2)
        
    return jsonify({"success": True, "message": "Skills reordered successfully"})

@app.route('/admin/projects/categories/manage', methods=['GET', 'POST'])
@admin_required
def manage_categories():
    try:
        with open(CATEGORIES_FILE, 'r') as f:
            categories = json.load(f)
    except:
        categories = []
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'add':
            new_name = request.form.get('name', '').strip()
            if new_name and new_name not in [c['name'] for c in categories]:
                new_id = max([c['id'] for c in categories], default=0) + 1
                categories.append({'id': new_id, 'name': new_name})
        elif action == 'edit':
            cat_id = int(request.form.get('id'))
            new_name = request.form.get('name', '').strip()
            for c in categories:
                if c['id'] == cat_id:
                    c['name'] = new_name
        elif action == 'delete':
            cat_id = int(request.form.get('id'))
            categories = [c for c in categories if c['id'] != cat_id]
        elif action == 'move':
            # Move a category up/down by swapping its position in the list.
            # Be tolerant of IDs stored as strings/ints.
            try:
                cat_id = int(request.form.get('id'))
            except (TypeError, ValueError):
                cat_id = None

            direction = (request.form.get('direction') or '').strip().lower()

            def _cat_id(value):
                try:
                    return int(value)
                except (TypeError, ValueError):
                    return None

            if cat_id is not None:
                index = next((i for i, c in enumerate(categories) if _cat_id(c.get('id')) == cat_id), None)
                if index is not None:
                    if direction == 'up' and index > 0:
                        categories[index - 1], categories[index] = categories[index], categories[index - 1]
                    elif direction == 'down' and index < len(categories) - 1:
                        categories[index + 1], categories[index] = categories[index], categories[index + 1]

        # Normalize IDs to reflect the visual order (1..n). This makes the order
        # consistent even if some parts of the UI sort by id.
        for idx, c in enumerate(categories):
            c['id'] = idx + 1

        with open(CATEGORIES_FILE, 'w') as f:
            json.dump(categories, f, indent=2)
        # Use 303 to force a GET after POST and avoid some browser caching behavior.
        return redirect(url_for('manage_categories'), code=303)

    resp = make_response(render_template('manage_categories.html', categories=categories))
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'
    return resp

@app.route('/admin/skill-categories', methods=['GET', 'POST'])
@admin_required
def manage_skill_categories():
    try:
        with open(SKILL_CATEGORIES_FILE, 'r') as f:
            skill_categories = json.load(f)
    except:
        skill_categories = []
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'add':
            name = request.form.get('name')
            if name and not any(c['name'].lower() == name.lower() for c in skill_categories):
                new_id = max([c['id'] for c in skill_categories], default=0) + 1
                skill_categories.append({'id': new_id, 'name': name})
        elif action == 'edit':
            cat_id = int(request.form.get('id'))
            name = request.form.get('name')
            for c in skill_categories:
                if c['id'] == cat_id:
                    c['name'] = name
        elif action == 'delete':
            cat_id = int(request.form.get('id'))
            skill_categories = [c for c in skill_categories if c['id'] != cat_id]
        with open(SKILL_CATEGORIES_FILE, 'w') as f:
            json.dump(skill_categories, f, indent=2)
        return redirect(url_for('manage_skill_categories'))
    
    try:
        with open(SKILLS_FILE, 'r') as f:
            skills = json.load(f)
    except:
        skills = []
        
    return render_template('manage_skill_categories.html', skill_categories=skill_categories, skills=skills)

# API routes for admin
@app.route('/admin/api/visitors')
@admin_required
def api_visitors():
    try:
        with open(VISITORS_FILE, 'r') as f:
            visitors = json.load(f)
        return jsonify(visitors)
    except:
        return jsonify([])

@app.route('/admin/api/projects', methods=['GET', 'POST', 'PUT', 'DELETE'])
@admin_required
def api_projects():
    try:
        with open(PROJECTS_FILE, 'r') as f:
            projects = json.load(f)
    except:
        projects = []
    
    if request.method == 'GET':
        return jsonify(projects)
    
    elif request.method == 'POST':
        new_project = request.json
        new_project['id'] = max([p.get('id', 0) for p in projects], default=0) + 1
        # Remove mockup_type if present
        new_project.pop('mockup_type', None)
        projects.append(new_project)
        
        with open(PROJECTS_FILE, 'w') as f:
            json.dump(projects, f, indent=2)
        
        return jsonify(new_project)
    
    elif request.method == 'PUT':
        project_id = request.json.get('id')
        updated_project = request.json
        updated_project.pop('mockup_type', None)
        for i, project in enumerate(projects):
            if project.get('id') == project_id:
                projects[i] = updated_project
                break
        
        with open(PROJECTS_FILE, 'w') as f:
            json.dump(projects, f, indent=2)
        
        return jsonify(updated_project)
    
    elif request.method == 'DELETE':
        project_id = request.json.get('id')
        projects = [p for p in projects if p.get('id') != project_id]
        
        with open(PROJECTS_FILE, 'w') as f:
            json.dump(projects, f, indent=2)
        
        return jsonify({"success": True})

@app.route('/admin/api/skills', methods=['GET', 'POST', 'PUT', 'DELETE'])
@admin_required
def api_skills():
    try:
        with open(SKILLS_FILE, 'r') as f:
            skills = json.load(f)
    except:
        skills = []
    
    if request.method == 'GET':
        return jsonify(skills)
    
    elif request.method == 'POST':
        new_skill = request.json
        new_skill['id'] = max([s.get('id', 0) for s in skills], default=0) + 1
        skills.append(new_skill)
        
        with open(SKILLS_FILE, 'w') as f:
            json.dump(skills, f, indent=2)
        
        return jsonify(new_skill)
    
    elif request.method == 'PUT':
        skill_id = request.json.get('id')
        updated_skill = request.json
        
        for i, skill in enumerate(skills):
            if skill.get('id') == skill_id:
                skills[i] = updated_skill
                break
        
        with open(SKILLS_FILE, 'w') as f:
            json.dump(skills, f, indent=2)
        
        return jsonify(updated_skill)
    
    elif request.method == 'DELETE':
        skill_id = request.json.get('id')
        skills = [s for s in skills if s.get('id') != skill_id]
        
        with open(SKILLS_FILE, 'w') as f:
            json.dump(skills, f, indent=2)
        
        return jsonify({"success": True})
@app.route('/api/config')
def api_get_config():
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return jsonify(config)
    except (FileNotFoundError, json.JSONDecodeError):
        return jsonify({})

@app.route('/api/about')
def api_get_about():
    try:
        with open(ABOUT_FILE, 'r', encoding='utf-8') as f:
            about_data = json.load(f)
        return jsonify(about_data)
    except (FileNotFoundError, json.JSONDecodeError):
        return jsonify({'description': '', 'tags': [], 'timeline': []})

@app.route('/api/contact')
def api_get_contact():
    try:
        with open(CONTACT_FILE, 'r', encoding='utf-8') as f:
            contact_data = json.load(f)
        return jsonify(contact_data)
    except (FileNotFoundError, json.JSONDecodeError):
        return jsonify({'description': '', 'items': []})


# API routes for frontend
@app.route('/api/projects')
def api_get_projects():
    # Read sort order from config.json
    config_path = os.path.join(DATA_DIR, 'config.json')
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        sort_by = config.get('project_sort_by', 'date')
    except:
        sort_by = 'date'
    try:
        with open(PROJECTS_FILE, 'r') as f:
            projects = json.load(f)
    except:
        projects = []
    # Sort projects by selected field
    # manual => keep file order (allows admin reordering to reflect on the public site)
    if sort_by == 'id':
        # Ensure id is always int and sort ascending (lowest id first)
        projects.sort(key=lambda p: int(p.get('id', 0)))
    elif sort_by == 'date':
        # Sort by date descending (latest first)
        projects.sort(key=lambda p: p.get('date', ''), reverse=True)
    else:
        # manual or unknown => keep file order
        pass

    return jsonify(projects)

@app.route('/api/skills')
def api_get_skills():
    try:
        with open(SKILLS_FILE, 'r') as f:
            skills = json.load(f)
        return jsonify(skills)
    except:
        return jsonify([])

@app.route('/api/categories')
def api_get_categories():
    """Return project categories in the admin-defined order."""
    try:
        with open(CATEGORIES_FILE, 'r', encoding='utf-8') as f:
            categories = json.load(f)
    except Exception:
        categories = []

    resp = make_response(jsonify(categories))
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'
    return resp


@app.route('/api/skill-categories')
def api_get_skill_categories():
    try:
        with open(SKILL_CATEGORIES_FILE, 'r') as f:
            skill_categories = json.load(f)
        return jsonify(skill_categories)
    except:
        return jsonify([])

@app.route('/api/track_visit', methods=['POST'])
def track_visit():
    data = request.json
    page = data.get('page')

    if not page:
        return jsonify({'status': 'error', 'message': 'Page not specified'}), 400

    if request.headers.getlist("X-Forwarded-For"):
        ip = request.headers.getlist("X-Forwarded-For")[0]
    else:
        ip = request.remote_addr

    if ip in ('127.0.0.1', 'localhost') or ip.startswith(('192.168.', '10.', '172.')):
        return jsonify({'status': 'ignored', 'message': 'Localhost visit not tracked'})

    try:
        with open(VISITORS_FILE, 'r') as f:
            visitors = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        visitors = []

    # Check if this IP has already visited this page (tab)
    if any(v.get('ip') == ip and v.get('path') == page for v in visitors):
        return jsonify({'status': 'exists', 'message': 'Visit already recorded'})

    visitor_data = {
        'ip': ip,
        'timestamp': datetime.now().isoformat(),
        'path': page,
        'method': request.method,
        'user_agent': request.headers.get('User-Agent', ''),
        'referrer': request.referrer or '',
        'country': None,
        'city': None
    }
    visitors.append(visitor_data)
    
    # Keep only last 10000 entries
    if len(visitors) > 10000:
        visitors = visitors[-10000:]

    with open(VISITORS_FILE, 'w') as f:
        json.dump(visitors, f, indent=2)

    return jsonify({'status': 'ok', 'message': 'Visit tracked'})

@app.route('/admin/certifications')
@admin_required
def admin_certifications():
    try:
        with open(CERTIFICATIONS_FILE, 'r') as f:
            certifications = json.load(f)
    except Exception:
        certifications = []

    try:
        with open(CERTIFICATION_CATEGORIES_FILE, 'r', encoding='utf-8') as f:
            categories = json.load(f)
    except Exception:
        categories = []

    category_order = [c.get('name') for c in categories if c.get('name')]
    category_set = set(category_order)

    # Add any categories that exist on certifications but are missing from categories.json
    extra_categories = []
    for c in certifications:
        cat = c.get('category')
        if cat and cat not in category_set and cat not in extra_categories:
            extra_categories.append(cat)

    grouped = []
    for cat_name in category_order + extra_categories:
        grouped.append({
            'category': cat_name,
            'certifications': [c for c in certifications if c.get('category') == cat_name]
        })

    if not grouped and certifications:
        grouped.append({'category': 'Uncategorized', 'certifications': certifications})

    return render_template('admin_certifications.html', grouped_certifications=grouped, certifications=certifications)

@app.route('/admin/certifications/add', methods=['GET', 'POST'])
@admin_required
def add_certification():
    if request.method == 'POST':
        try:
            with open(CERTIFICATIONS_FILE, 'r') as f:
                certifications = json.load(f)
            
            data = request.form
            new_id = max([c.get('id', 0) for c in certifications], default=0) + 1
            
            new_certification = {
                "id": new_id,
                "name": data.get('name', ''),
                "issuer": data.get('issuer', ''),
                "category": data.get('category', ''),
                "date": data.get('date', ''),
                "url": data.get('url', ''),
                "image": data.get('image', '')
            }
            
            certifications.append(new_certification)
            with open(CERTIFICATIONS_FILE, 'w') as f:
                json.dump(certifications, f, indent=2)
                
            return redirect(url_for('admin_certifications'))
        except Exception as e:
            return str(e), 500

    try:
        with open(CERTIFICATION_CATEGORIES_FILE, 'r') as f:
            categories = json.load(f)
    except:
        categories = []
    return render_template('add_certification.html', categories=categories)

@app.route('/admin/certifications/edit/<int:cert_id>', methods=['GET', 'POST'])
@admin_required
def edit_certification(cert_id):
    try:
        with open(CERTIFICATIONS_FILE, 'r') as f:
            certifications = json.load(f)
    except:
        certifications = []
    
    cert = next((c for c in certifications if c.get('id') == cert_id), None)
    if not cert:
        return redirect(url_for('admin_certifications'))
    
    if request.method == 'POST':
        data = request.form
        cert.update({
            "name": data.get('name', ''),
            "issuer": data.get('issuer', ''),
            "category": data.get('category', ''),
            "date": data.get('date', ''),
            "url": data.get('url', ''),
            "image": data.get('image', '')
        })
        
        with open(CERTIFICATIONS_FILE, 'w') as f:
            json.dump(certifications, f, indent=2)
        return redirect(url_for('admin_certifications'))

    try:
        with open(CERTIFICATION_CATEGORIES_FILE, 'r') as f:
            categories = json.load(f)
    except:
        categories = []
    return render_template('edit_certification.html', certification=cert, categories=categories)

@app.route('/admin/certifications/delete/<int:cert_id>', methods=['POST'])
@admin_required
def delete_certification(cert_id):
    try:
        with open(CERTIFICATIONS_FILE, 'r') as f:
            certifications = json.load(f)
        certifications = [c for c in certifications if c.get('id') != cert_id]
        with open(CERTIFICATIONS_FILE, 'w') as f:
            json.dump(certifications, f, indent=2)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/admin/certifications/move', methods=['POST'])
@admin_required
def move_certification():
    try:
        with open(CERTIFICATIONS_FILE, 'r') as f:
            certifications = json.load(f)
        
        cert_id = int(request.form.get('id'))
        direction = request.form.get('direction').lower()
        
        def _cat(c): return (c.get('category') or '').strip().lower()
        
        idx = next((i for i, c in enumerate(certifications) if c.get('id') == cert_id), None)
        if idx is not None:
            current_cat = _cat(certifications[idx])
            if direction == 'up':
                prev_idx = next((i for i in range(idx-1, -1, -1) if _cat(certifications[i]) == current_cat), None)
                if prev_idx is not None:
                    certifications[prev_idx], certifications[idx] = certifications[idx], certifications[prev_idx]
            elif direction == 'down':
                next_idx = next((i for i in range(idx+1, len(certifications)) if _cat(certifications[i]) == current_cat), None)
                if next_idx is not None:
                    certifications[next_idx], certifications[idx] = certifications[idx], certifications[next_idx]
            
            with open(CERTIFICATIONS_FILE, 'w') as f:
                json.dump(certifications, f, indent=2)
        return redirect(url_for('admin_certifications'))
    except Exception as e:
        return str(e), 500

@app.route('/admin/certifications/categories', methods=['GET', 'POST'])
@admin_required
def manage_certification_categories():
    try:
        with open(CERTIFICATION_CATEGORIES_FILE, 'r') as f:
            categories = json.load(f)
    except:
        categories = []
        
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'add':
            name = request.form.get('name').strip()
            if name and not any(c['name'].lower() == name.lower() for c in categories):
                new_id = max([c['id'] for c in categories], default=0) + 1
                categories.append({'id': new_id, 'name': name})
        elif action == 'edit':
            cat_id = int(request.form.get('id'))
            name = request.form.get('name').strip()
            for c in categories:
                if c['id'] == cat_id:
                    c['name'] = name
        elif action == 'delete':
            cat_id = int(request.form.get('id'))
            categories = [c for c in categories if c['id'] != cat_id]
        elif action == 'move':
            cat_id = int(request.form.get('id'))
            direction = request.form.get('direction')
            idx = next((i for i, c in enumerate(categories) if c['id'] == cat_id), None)
            if idx is not None:
                if direction == 'up' and idx > 0:
                    categories[idx-1], categories[idx] = categories[idx], categories[idx-1]
                elif direction == 'down' and idx < len(categories) - 1:
                    categories[idx+1], categories[idx] = categories[idx], categories[idx+1]
        
        # Normalize IDs
        for i, c in enumerate(categories):
            c['id'] = i + 1
            
        with open(CERTIFICATION_CATEGORIES_FILE, 'w') as f:
            json.dump(categories, f, indent=2)
        return redirect(url_for('manage_certification_categories'))
        
    return render_template('manage_certification_categories.html', categories=categories)

# API routes for certifications
@app.route('/api/certifications')
def api_get_certifications():
    try:
        with open(CERTIFICATIONS_FILE, 'r') as f:
            certifications = json.load(f)
        return jsonify(certifications)
    except:
        return jsonify([])

@app.route('/api/certification-categories')
def api_get_certification_categories():
    try:
        with open(CERTIFICATION_CATEGORIES_FILE, 'r') as f:
            categories = json.load(f)
        return jsonify(categories)
    except:
        return jsonify([])

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Don't handle /admin routes here - let them be handled by their specific view functions
    if path.startswith('admin'):
        return redirect(url_for('admin_dashboard'))
        
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            resp = make_response(send_from_directory(static_folder_path, 'index.html'))
            resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            resp.headers['Pragma'] = 'no-cache'
            resp.headers['Expires'] = '0'
            return resp
        else:
            return "index.html not found", 404

@app.route('/media/<media_type>/<filename>')
def serve_media(media_type, filename):
    allowed_types = {'image', 'video', 'gif'}
    if media_type not in allowed_types:
        abort(404)
    static_folder_path = app.static_folder
    media_folder = os.path.join(static_folder_path, media_type)
    file_path = os.path.join(media_folder, filename)
    if os.path.exists(file_path):
        return send_from_directory(media_folder, filename)
    else:
        abort(404)

# Add this helper function near the top of the file with other helper functions
def validate_mockup_content(content):
    """Validates and processes mockup content into the correct format."""
    if not content or not isinstance(content, str):
        return content
    
    content = content.strip()
    # Handle image/video paths
    if any(content.startswith(prefix) for prefix in ['image/', 'video/', 'slides/']):
        return content
    # Handle img1: format
    if content.startswith('img1:'):
        return content
    # Handle YouTube URLs
    if 'youtube.com/watch' in content or 'youtu.be/' in content:
        return content
    # Try parsing as JSON
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # If not JSON and doesn't match other formats, treat as plain text
        return content

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
