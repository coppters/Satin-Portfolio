import json
import os

GALLERY_ROOT = "./gallery"
OUTPUT_FILE = "galleryList.js"
SUPPORTED_EXTENSIONS = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".webm")


def scan_gallery(root):
    gallery_items = []
    for category in sorted(os.listdir(root)):
        category_path = os.path.join(root, category)
        if not os.path.isdir(category_path):
            continue

        file_names = os.listdir(category_path)
        lower_names = {name.lower(): name for name in file_names}
        source_files = [
            name
            for name in file_names
            if name.lower().endswith(SUPPORTED_EXTENSIONS)
            and not name.lower().endswith(".thumb.webp")
        ]
        source_files.sort(
            key=lambda name: (
                os.path.splitext(name)[0].lower(),
                name.lower().endswith(".webm"),
            )
        )

        handled_stems = set()
        for file_name in source_files:
            stem, _ = os.path.splitext(file_name)
            stem_key = stem.lower()
            if stem_key in handled_stems:
                continue
            handled_stems.add(stem_key)

            webm_name = lower_names.get(f"{stem_key}.webm")
            thumb_name = lower_names.get(f"{stem_key}.thumb.webp")
            preferred_full = webm_name or file_name
            preferred_thumb = thumb_name or file_name

            gallery_items.append(
                {
                    "title": stem.replace("_", " "),
                    "category": category.capitalize(),
                    "thumb": f"{root}/{category}/{preferred_thumb}".replace("\\", "/"),
                    "full": f"{root}/{category}/{preferred_full}".replace("\\", "/"),
                    "type": (
                        "video"
                        if preferred_full.lower().endswith(".webm")
                        else "image"
                    ),
                }
            )

    return gallery_items


if __name__ == "__main__":
    items = scan_gallery(GALLERY_ROOT)
    js_content = "window.SG_ITEMS = " + json.dumps(items, indent=4) + ";"

    with open(OUTPUT_FILE, "w", encoding="utf-8") as output:
        output.write(js_content)

    print(f"Generated {OUTPUT_FILE} with {len(items)} items.")
