import psycopg2
conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/wealthspot')
cur = conn.cursor()
cur.execute("SELECT id, title, min_investment, property_specs FROM opportunities WHERE title ILIKE '%50-Acre%'")
print(cur.fetchall())
