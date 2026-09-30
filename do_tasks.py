import re
import os

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

base_dir = '/Users/nicolascortesvidaller/yossico'

# 1. Create rastreo.html
login_html = read_file(f'{base_dir}/web/login.html')
# We need to build a custom page, so I'll just provide a full HTML string based on login.html's head, header, and script dependencies.

# Wait, the best way to get the exact header and footer is to extract it from index.html or login.html.
# I will use write_to_file tool for the full HTML so I can format it better.
pass
