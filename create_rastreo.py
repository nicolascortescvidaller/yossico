import re
from bs4 import BeautifulSoup

base = '/Users/nicolascortesvidaller/yossico'
def readf(p):
    with open(p, 'r', encoding='utf-8') as f: return f.read()
def writef(p, c):
    with open(p, 'w', encoding='utf-8') as f: f.write(c)

login = readf(f'{base}/web/login.html')

# We can just manually replace the body content with regex.
# login.html has <div class="auth-page">
# I'll replace everything inside auth-form-panel or just replace the whole auth-page.
# Even better, let's just make rastreo.html a standalone clean file with the same header and footer as index.html
pass
