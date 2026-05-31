import re

path = "c:/Users/repos/WealthSpot/apps/web/src/pages/CreateOpportunityPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

def repl(m):
    key = m.group(1)
    prefix = m.group(2)
    return prefix + f"{{formErrors.{key}}}</p>}}"

new_content = re.sub(r"\{fe\('([^']+)'\) && (<p[^>]*><AlertCircle[^>]*>\s*)[^<]+</p>}", repl, content)

with open(path, "w", encoding="utf-8") as f:
    f.write(new_content)
print("Replaced successfully")
