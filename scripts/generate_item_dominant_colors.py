#!/usr/bin/env python3
import argparse
import json
import math
import os
import random
from pathlib import Path

from PIL import Image


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def srgb_to_linear(channel: float) -> float:
    c = channel / 255.0
    if c <= 0.04045:
        return c / 12.92
    return ((c + 0.055) / 1.055) ** 2.4


def linear_to_srgb(channel: float) -> float:
    if channel <= 0.0031308:
        value = 12.92 * channel
    else:
        value = 1.055 * (channel ** (1 / 2.4)) - 0.055
    return clamp(value * 255.0, 0.0, 255.0)


def rgb_to_lab(r: int, g: int, b: int) -> tuple[float, float, float]:
    rl = srgb_to_linear(r)
    gl = srgb_to_linear(g)
    bl = srgb_to_linear(b)

    x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375
    y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750
    z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041

    xn = 0.95047
    yn = 1.00000
    zn = 1.08883

    def f(t: float) -> float:
        delta = 6 / 29
        if t > delta**3:
            return t ** (1 / 3)
        return t / (3 * delta**2) + 4 / 29

    fx = f(x / xn)
    fy = f(y / yn)
    fz = f(z / zn)

    l = 116 * fy - 16
    a = 500 * (fx - fy)
    b_star = 200 * (fy - fz)
    return (l, a, b_star)


def lab_to_rgb(l: float, a: float, b_star: float) -> tuple[int, int, int]:
    xn = 0.95047
    yn = 1.00000
    zn = 1.08883

    fy = (l + 16) / 116
    fx = fy + (a / 500)
    fz = fy - (b_star / 200)

    def finv(t: float) -> float:
        delta = 6 / 29
        if t > delta:
            return t**3
        return 3 * delta**2 * (t - 4 / 29)

    x = xn * finv(fx)
    y = yn * finv(fy)
    z = zn * finv(fz)

    rl = x * 3.2404542 + y * -1.5371385 + z * -0.4985314
    gl = x * -0.9692660 + y * 1.8760108 + z * 0.0415560
    bl = x * 0.0556434 + y * -0.2040259 + z * 1.0572252

    r = int(round(linear_to_srgb(clamp(rl, 0.0, 1.0))))
    g = int(round(linear_to_srgb(clamp(gl, 0.0, 1.0))))
    b = int(round(linear_to_srgb(clamp(bl, 0.0, 1.0))))
    return (r, g, b)


def euclidean_sq(
    p1: tuple[float, float, float], p2: tuple[float, float, float]
) -> float:
    return (p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2 + (p1[2] - p2[2]) ** 2


def initialize_kmeans_pp(
    points: list[tuple[float, float, float]], k: int, rng: random.Random
) -> list[tuple[float, float, float]]:
    centers: list[tuple[float, float, float]] = [rng.choice(points)]

    while len(centers) < k:
        distances = []
        total = 0.0
        for p in points:
            d2 = min(euclidean_sq(p, c) for c in centers)
            distances.append(d2)
            total += d2

        if total <= 0:
            centers.append(rng.choice(points))
            continue

        threshold = rng.uniform(0, total)
        cumulative = 0.0
        chosen = points[-1]
        for p, d2 in zip(points, distances):
            cumulative += d2
            if cumulative >= threshold:
                chosen = p
                break
        centers.append(chosen)

    return centers


def kmeans_lab(
    points: list[tuple[float, float, float]],
    k: int,
    max_iterations: int = 30,
    seed: int = 42,
) -> tuple[list[tuple[float, float, float]], list[int]]:
    if not points:
        return [], []
    if k <= 0:
        raise ValueError("k must be positive")
    if len(points) < k:
        k = len(points)

    rng = random.Random(seed)
    centers = initialize_kmeans_pp(points, k, rng)
    labels = [0] * len(points)

    for _ in range(max_iterations):
        changed = False
        for i, p in enumerate(points):
            nearest = min(range(k), key=lambda ci: euclidean_sq(p, centers[ci]))
            if labels[i] != nearest:
                labels[i] = nearest
                changed = True

        sums = [(0.0, 0.0, 0.0, 0) for _ in range(k)]
        for p, label in zip(points, labels):
            l_sum, a_sum, b_sum, count = sums[label]
            sums[label] = (l_sum + p[0], a_sum + p[1], b_sum + p[2], count + 1)

        new_centers = []
        for idx, (l_sum, a_sum, b_sum, count) in enumerate(sums):
            if count == 0:
                new_centers.append(rng.choice(points))
            else:
                new_centers.append((l_sum / count, a_sum / count, b_sum / count))

        if not changed:
            centers = new_centers
            break
        centers = new_centers

    return centers, labels


def visible_rgb_for_texture(
    texture_path: Path, alpha_threshold: int = 1
) -> list[tuple[int, int, int]] | None:
    if not texture_path.exists():
        return None

    with Image.open(texture_path) as image:
        rgba = image.convert("RGBA")
        pixels = list(rgba.get_flattened_data())

    return [(r, g, b) for (r, g, b, a) in pixels if a >= alpha_threshold]


def median_color_hex_for_visible_rgb(
    visible_rgb: list[tuple[int, int, int]],
) -> str | None:
    if not visible_rgb:
        return None

    def median_channel(values: list[int]) -> int:
        sorted_values = sorted(values)
        count = len(sorted_values)
        mid = count // 2
        if count % 2 == 1:
            return sorted_values[mid]
        return int(round((sorted_values[mid - 1] + sorted_values[mid]) / 2))

    r = median_channel([pixel[0] for pixel in visible_rgb])
    g = median_channel([pixel[1] for pixel in visible_rgb])
    b = median_channel([pixel[2] for pixel in visible_rgb])
    return f"#{r:02X}{g:02X}{b:02X}"


def dominant_color_hex_for_visible_rgb(
    visible_rgb: list[tuple[int, int, int]],
    cluster_min_ratio: float = 0.1,
    lightness_weight: float = 0.0,
    chroma_weight: float = 0.0,
    size_weight: float = 0.8,
) -> str | None:
    if not visible_rgb:
        return None

    lab_points = [rgb_to_lab(r, g, b) for (r, g, b) in visible_rgb]

    if len(lab_points) >= 4:
        k = 4
    elif len(lab_points) >= 3:
        k = 3
    else:
        k = len(lab_points)

    centers, labels = kmeans_lab(lab_points, k=k)
    if not centers:
        return None

    counts = [0] * len(centers)
    for label in labels:
        counts[label] += 1

    total_pixels = sum(counts)
    min_cluster_size = max(1, int(math.ceil(total_pixels * cluster_min_ratio)))
    candidates = [idx for idx, count in enumerate(counts) if count >= min_cluster_size]

    if not candidates:
        candidates = [max(range(len(centers)), key=lambda idx: counts[idx])]

    def score_cluster(idx: int) -> float:
        l, a, b_star = centers[idx]
        chroma = math.sqrt((a * a) + (b_star * b_star))
        size_percentage = (counts[idx] / total_pixels) * 100.0
        return (
            (l * lightness_weight)
            + (chroma * chroma_weight)
            + (size_percentage * size_weight)
        )

    dominant_cluster = max(
        candidates,
        key=lambda idx: (
            score_cluster(idx),
            counts[idx],
            centers[idx][0],
        ),
    )
    dominant_lab = centers[dominant_cluster]

    r, g, b = lab_to_rgb(*dominant_lab)
    return f"#{r:02X}{g:02X}{b:02X}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Populate items.json with mostDominantColor using CIELAB + K-Means."
        )
    )
    parser.add_argument(
        "--input",
        default=os.path.join("public", "data", "items.json"),
        help="Path to items.json (default: public/data/items.json).",
    )
    parser.add_argument(
        "--textures-dir",
        default=os.path.join("public", "items"),
        help="Path to item textures directory (default: public/items).",
    )
    parser.add_argument(
        "--alpha-threshold",
        type=int,
        default=1,
        help="Minimum alpha to include a pixel (default: 1).",
    )
    parser.add_argument(
        "--cluster-min-ratio",
        type=float,
        default=0.08,
        help=(
            "Minimum cluster size ratio to consider for scoring "
            "(default: 0.08 for 8%%)."
        ),
    )
    parser.add_argument(
        "--lightness-weight",
        type=float,
        default=0.0,
        help="Weight for LAB lightness (L*) in cluster scoring (default: 2.0).",
    )
    parser.add_argument(
        "--chroma-weight",
        type=float,
        default=0.0,
        help="Weight for LAB chroma in cluster scoring (default: 1.0).",
    )
    parser.add_argument(
        "--size-weight",
        type=float,
        default=0.8,
        help="Weight for cluster size percentage in scoring (default: 0.5).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not (0.0 <= args.cluster_min_ratio <= 1.0):
        raise ValueError("--cluster-min-ratio must be between 0.0 and 1.0.")
    if args.lightness_weight < 0 or args.chroma_weight < 0 or args.size_weight < 0:
        raise ValueError("Scoring weights must be non-negative.")

    items_path = Path(args.input)
    textures_dir = Path(args.textures_dir)

    if not items_path.exists():
        raise FileNotFoundError(f"items.json not found: {items_path}")
    if not textures_dir.exists():
        raise FileNotFoundError(f"textures directory not found: {textures_dir}")

    with items_path.open("r", encoding="utf-8") as handle:
        root = json.load(handle)

    items = root.get("items")
    if not isinstance(items, dict):
        raise ValueError("Invalid items.json format: 'items' must be an object.")

    missing_textures = 0
    computed = 0
    transparent_only = 0

    for item_id, item_data in items.items():
        if not isinstance(item_data, dict):
            continue
        texture_path = textures_dir / f"{item_id}.png"
        visible_rgb = visible_rgb_for_texture(
            texture_path, alpha_threshold=args.alpha_threshold
        )
        if visible_rgb is None:
            missing_textures += 1
            dominant = None
            average = None
        elif not visible_rgb:
            transparent_only += 1
            dominant = None
            average = None
        else:
            dominant = dominant_color_hex_for_visible_rgb(
                visible_rgb,
                cluster_min_ratio=args.cluster_min_ratio,
                lightness_weight=args.lightness_weight,
                chroma_weight=args.chroma_weight,
                size_weight=args.size_weight,
            )
            average = median_color_hex_for_visible_rgb(visible_rgb)
            computed += 1

        item_data["mostDominantColor"] = dominant
        item_data["medianColor"] = average

    with items_path.open("w", encoding="utf-8") as handle:
        json.dump(root, handle, ensure_ascii=False, indent=4)
        handle.write("\n")

    total = len(items)
    print(
        "Updated items.json with mostDominantColor and medianColor "
        f"for {total} items ({computed} computed, "
        f"{missing_textures} missing textures, {transparent_only} transparent-only)."
    )


if __name__ == "__main__":
    main()
