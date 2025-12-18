import json
with open('d:/testing/portfolio/mysite/data/skills.json', 'r') as f:
    skills = json.load(f)
for i, s in enumerate(skills):
    if 'id' not in s:
        print(f"Skill at index {i} has no id: {s.get('name', 'UNKNOWN')}")
    else:
        print(f"ID: {s['id']}, Type: {type(s['id'])}, Name: {s.get('name')}")
