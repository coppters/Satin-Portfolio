import os
import json

# === CONFIG ===
GALLERY_ROOT = "./gallery"
OUTPUT_FILE = "galleryList.js"

# === COLLECT ALL FILES ===
def scan_gallery(root):
    gallery_items = []
    for category in os.listdir(root):
        category_path = os.path.join(root, category)
        if not os.path.isdir(category_path):
            continue
        
        for file_name in os.listdir(category_path):
            if file_name.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
                title = os.path.splitext(file_name)[0]
                thumb = f"{root}/{category}/{file_name}".replace("\\", "/")
                full = thumb  # same for now
                gallery_items.append({
                    "title": title,
                    "category": category.capitalize(),
                    "thumb": thumb,
                    "full": full
                })
    return gallery_items

# === MAIN ===
if __name__ == "__main__":
    items = scan_gallery(GALLERY_ROOT)
    js_content = "window.SG_ITEMS = " + json.dumps(items, indent=4) + ";"

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"✅ Generated {OUTPUT_FILE} with {len(items)} items.")
