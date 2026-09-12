import re

with open('src/data/liveAisVessels.js', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(r'name[\'"]?:\s*[\'"]([^\'"]+)[\'"].*?coordinates[\'"]?:\s*\[([0-9\.\s,-]+)\]', re.DOTALL)
matches = pattern.findall(text)

print(f"Checking all {len(matches)} vessels:")
for name, coords in matches:
    parts = [float(x.strip()) for x in coords.split(',')]
    lat, lng = parts[0], parts[1]
    
    # Coastline limits (approximate westernmost water coordinate for each latitude)
    # Tamil Nadu / Chennai (lat 12.5 - 13.5): coast is ~80.28
    # Andhra / Krishnapatnam (lat 14.0 - 15.0): coast is ~80.15
    # Andhra / Machilipatnam (lat 15.5 - 16.5): coast is ~80.80 - 81.50
    # Visakhapatnam / Gangavaram (lat 17.5 - 17.8): coast is ~83.25
    # Gopalpur (lat 19.2 - 19.4): coast is ~84.95
    # Paradip (lat 20.2 - 20.4): coast is ~86.65
    # Dhamra (lat 20.7 - 21.0): coast is ~86.95
    # Sandheads / Bengal (lat 21.0 - 22.0): coast is ~88.00 (except river channel 88.01-88.08)
    
    warn = False
    msg = ''
    if 21.5 <= lat <= 22.1:
        if lat >= 22.03:
            warn = True
            msg = f"North of Haldia docks (lat {lat})"
        elif 21.60 <= lat <= 21.90 and lng > 88.045:
            warn = True
            msg = f"On Sagar Island (lat {lat}, lng {lng})"
        elif lat >= 21.95 and (lng < 88.03 or lng > 88.08):
            warn = True
            msg = f"Outside Haldia channel (lat {lat}, lng {lng})"
    elif lat > 20.0 and lat < 20.5 and lng < 86.65:
        warn = True
        msg = f"Inland near Paradip (lng {lng})"
    elif lat > 17.5 and lat < 17.8 and lng < 83.25:
        warn = True
        msg = f"Inland near Vizag (lng {lng})"
    elif lat > 19.1 and lat < 19.4 and lng < 84.95:
        warn = True
        msg = f"Inland near Gopalpur (lng {lng})"

    if warn:
        print(f"ALERT: {name:30} : [{lat:.4f}, {lng:.4f}] -> {msg}")
