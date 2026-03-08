#!/usr/bin/env python3
"""
Migration script: move possibleEnchantments from inside the 'item' sub-object
to the top level of each item entry.

Old schema (inside item sub-object):
    {
        "item": {
            "possibleEnchantments": [...],
            ...other item fields...
        }
    }

New schema (top-level property):
    {
        "possibleEnchantments": [...],
        "item": {
            ...other item fields...
        }
    }

Usage:
    python migrate-enchantments.py [options]

Options:
    --dry           Perform a dry run: print what would change without writing anything.
    --backup        Rename the original file to items.json.bak before overwriting it.
    --input PATH    Path to the input items.json  (default: data/items.json)
    --output PATH   Path to write the migrated file (default: same as input)
"""

import argparse
import json
import os
import shutil
import sys


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate possibleEnchantments from item sub-object to top level."
    )
    parser.add_argument(
        "--dry",
        action="store_true",
        help="Dry run: show what would be changed without writing anything.",
    )
    parser.add_argument(
        "--backup",
        action="store_true",
        help="Rename the original file to <filename>.bak before overwriting.",
    )
    parser.add_argument(
        "--input",
        default=os.path.join("data", "items.json"),
        metavar="PATH",
        help="Path to the source items.json (default: data/items.json).",
    )
    parser.add_argument(
        "--output",
        default=None,
        metavar="PATH",
        help="Path to write the migrated JSON (default: same as --input).",
    )
    return parser.parse_args()


def migrate(data: dict) -> tuple[dict, list[str]]:
    """
    Walk every item entry and promote possibleEnchantments from inside
    the 'item' sub-object to the top level of the entry.

    Returns:
        (migrated_data, list_of_changed_item_keys)
    """
    changed: list[str] = []
    items: dict = data.get("items", {})

    for item_key, item_entry in items.items():
        item_sub = item_entry.get("item")

        if not isinstance(item_sub, dict):
            continue

        if "possibleEnchantments" not in item_sub:
            continue

        # Promote to top level
        enchantments = item_sub.pop("possibleEnchantments")
        item_entry["possibleEnchantments"] = enchantments
        changed.append(item_key)

    return data, changed


def main() -> None:
    args = parse_args()

    input_path: str = args.input
    output_path: str = args.output if args.output is not None else args.input

    # ── Load ──────────────────────────────────────────────────────────────────
    if not os.path.isfile(input_path):
        print(f"[ERROR] Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO]  Reading: {input_path}")
    with open(input_path, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    # ── Migrate ───────────────────────────────────────────────────────────────
    migrated_data, changed_keys = migrate(data)

    if not changed_keys:
        print("[INFO]  No items required migration. The file is already up to date.")
        return

    print(f"[INFO]  Items to migrate ({len(changed_keys)}):")
    for key in changed_keys:
        print(f"          - {key}")

    # ── Dry run ───────────────────────────────────────────────────────────────
    if args.dry:
        print("\n[DRY RUN] No files were written. Remove --dry to apply the migration.")
        return

    # ── Backup ────────────────────────────────────────────────────────────────
    if args.backup:
        backup_path = input_path + ".bak"
        # If a backup already exists, do not silently overwrite it.
        if os.path.exists(backup_path):
            print(
                f"[WARN]  Backup already exists at {backup_path!r}. "
                "Skipping backup to avoid data loss.",
                file=sys.stderr,
            )
        else:
            shutil.copy2(input_path, backup_path)
            print(f"[INFO]  Backup created: {backup_path}")

    # ── Write ─────────────────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as fh:
        json.dump(migrated_data, fh, indent=2, ensure_ascii=False)
        fh.write("\n")  # trailing newline

    print(f"[INFO]  Migration complete. Written to: {output_path}")


if __name__ == "__main__":
    main()
