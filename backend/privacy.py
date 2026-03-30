"""
Output folder privacy setup for Windows.
Hides the outputs folder, strips EXIF metadata, and excludes from Windows indexing.
Run once during setup: python backend/privacy.py
"""

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
IMAGES_DIR = OUTPUTS_DIR / "images"
VIDEOS_DIR = OUTPUTS_DIR / "videos"


def set_hidden(path: Path):
    """Set the Windows hidden attribute on a folder."""
    if sys.platform != "win32":
        print(f"  Skipping (not Windows): {path}")
        return

    import ctypes

    FILE_ATTRIBUTE_HIDDEN = 0x02
    result = ctypes.windll.kernel32.SetFileAttributesW(str(path), FILE_ATTRIBUTE_HIDDEN)
    if result:
        print(f"  Hidden attribute set: {path}")
    else:
        print(f"  WARNING: Failed to set hidden attribute: {path}")


def write_desktop_ini(path: Path):
    """Write desktop.ini to exclude folder from Windows libraries and search."""
    ini_path = path / "desktop.ini"
    ini_content = (
        "[.ShellClassInfo]\n"
        "IconResource=%SystemRoot%\\system32\\imageres.dll,-112\n"
        "[LocalizedFileNames]\n"
        "[{F29F85E0-4FF9-1068-AB91-08002B27B3D9}]\n"
        "Prop3=19,0\n"
    )
    ini_path.write_text(ini_content)
    if sys.platform == "win32":
        import ctypes

        FILE_ATTRIBUTE_HIDDEN = 0x02
        FILE_ATTRIBUTE_SYSTEM = 0x04
        ctypes.windll.kernel32.SetFileAttributesW(
            str(ini_path), FILE_ATTRIBUTE_HIDDEN | FILE_ATTRIBUTE_SYSTEM
        )
    print(f"  desktop.ini written: {ini_path}")


def setup_privacy():
    """Set up output folder privacy."""
    print("Setting up output folder privacy...")

    # Create directories
    for d in [OUTPUTS_DIR, IMAGES_DIR, VIDEOS_DIR]:
        d.mkdir(parents=True, exist_ok=True)
        print(f"  Directory ensured: {d}")

    # Set hidden attribute
    set_hidden(OUTPUTS_DIR)

    # Write desktop.ini
    write_desktop_ini(OUTPUTS_DIR)

    # Create .nomedia file (prevents Android-style media scanning)
    nomedia = OUTPUTS_DIR / ".nomedia"
    nomedia.touch()

    print("\nPrivacy setup complete.")
    print("WARNING: Opening output files with Windows Photos will add them to the Photos library.")
    print("Use the built-in gallery in the web UI instead.")


def strip_exif(image_path: Path) -> bool:
    """Strip EXIF metadata from an image file. Returns True if successful."""
    try:
        from PIL import Image

        img = Image.open(image_path)
        # Re-save without EXIF
        data = list(img.getdata())
        clean = Image.new(img.mode, img.size)
        clean.putdata(data)
        clean.save(image_path)
        return True
    except ImportError:
        # Pillow not installed — skip silently
        return False
    except Exception as e:
        print(f"  WARNING: Failed to strip EXIF from {image_path}: {e}")
        return False


if __name__ == "__main__":
    setup_privacy()
