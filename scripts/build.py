"""Build a zero-network offline interactive lesson HTML from a trusted lesson directory."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def inline_script(source: str) -> str:
    return "<script>\n" + source.replace("</script", "<\\/script") + "\n</script>"


def inline_style(source: str) -> str:
    return "<style>\n" + source.replace("</style", "<\\/style") + "\n</style>"


def build_lesson(lesson_dir: Path, output_path: Path, overwrite: bool = False) -> None:
    config = json.loads((lesson_dir / "lesson.json").read_text(encoding="utf-8"))
    assets = ROOT / "assets"
    layout = config.get("layout", "slider")

    history = (
        [inline_script((assets / "lesson-history.js").read_text(encoding="utf-8"))]
        if config.get("history") is True
        else []
    )
    three_parts = []
    if layout == "workbench" or config.get("three") is True:
        three_parts = [
            "<!-- " + (assets / "vendor/THREE-LICENSE.txt").read_text(encoding="utf-8") + " -->",
            inline_script((assets / "vendor/three.js").read_text(encoding="utf-8")),
        ]

    if layout == "studio":
        if not isinstance(config.get("title"), str) or not config["title"].strip():
            raise ValueError("Missing text: title")
        model_file = lesson_dir / ("model.js" if (lesson_dir / "model.js").exists() else "bench.js")
        app_file = lesson_dir / ("app.js" if (lesson_dir / "app.js").exists() else "lab.js")
        if not model_file.exists() or not app_file.exists():
            raise ValueError("Studio layout requires model.js (or bench.js) and app.js (or lab.js)")

        studio_helpers = [
            inline_script((assets / "studio-svg.js").read_text(encoding="utf-8")),
        ]
        if config.get("three") is True:
            studio_helpers.append(inline_script((assets / "studio-3d.js").read_text(encoding="utf-8")))
        studio_helpers.append(inline_script((assets / "studio.js").read_text(encoding="utf-8")))

        title_escaped = config["title"].replace("<", "&lt;").replace(">", "&gt;")
        head = (
            '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            f"<title>{title_escaped} · 可交互课件</title>"
            + inline_style((assets / "studio.css").read_text(encoding="utf-8"))
            + "</head><body>"
        )
        parts = [
            head,
            *three_parts,
            *history,
            *studio_helpers,
            inline_script("const config = " + json.dumps(config, ensure_ascii=False) + ";"),
            inline_script(model_file.read_text(encoding="utf-8")),
            inline_script(app_file.read_text(encoding="utf-8")),
            "</body></html>",
        ]
    elif layout == "workbench":
        parts = [
            (lesson_dir / "lab.html").read_text(encoding="utf-8"),
            *three_parts,
            *history,
            inline_script((lesson_dir / "bench.js").read_text(encoding="utf-8")),
            inline_script((lesson_dir / "lab.js").read_text(encoding="utf-8")),
            "</body></html>",
        ]
    else:
        for field in ("title", "question", "control", "unit", "challenge", "limit"):
            if not isinstance(config.get(field), str) or not config[field].strip():
                raise ValueError(f"Missing text: {field}")
        if not config["min"] <= config["initial"] <= config["max"] or config["min"] >= config["max"]:
            raise ValueError("Invalid control range")
        parts = [
            (assets / "shell.html").read_text(encoding="utf-8"),
            *three_parts,
            *history,
            inline_script("const config = " + json.dumps(config, ensure_ascii=False)),
            inline_script((lesson_dir / "scene.js").read_text(encoding="utf-8")),
            inline_script((assets / "runtime.js").read_text(encoding="utf-8")),
            "</body></html>",
        ]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    mode = "w" if overwrite else "x"
    with output_path.open(mode, encoding="utf-8") as destination:
        destination.write("\n".join(parts))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("lesson", type=Path, help="directory containing lesson.json and scene/bench/model scripts")
    parser.add_argument("output", type=Path, help="destination standalone HTML path")
    parser.add_argument("--overwrite", action="store_true", help="allow replacing an existing output file")
    args = parser.parse_args()
    try:
        build_lesson(args.lesson, args.output, overwrite=args.overwrite)
    except ValueError as exc:
        parser.error(str(exc))


if __name__ == "__main__":
    main()
