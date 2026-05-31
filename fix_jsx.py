import re

path = "c:/Users/repos/WealthSpot/apps/web/src/pages/CreateOpportunityPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

def repl(m):
    indent = m.group(1)
    p_tag_attrs = m.group(2)
    key = m.group(3)
    return f"{indent}{{fe('{key}') && <p{p_tag_attrs}><AlertCircle className=\"h-3 w-3\" /> {{formErrors.{key}}}</p>}}"

new_content = re.sub(r"([ \t]*)<p([^>]+)><AlertCircle className=\"h-3 w-3\" /> \{formErrors\.([^}]+)\}</p>\}", repl, content)

with open(path, "w", encoding="utf-8") as f:
    f.write(new_content)
print("Restored conditionals successfully")
