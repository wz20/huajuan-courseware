"""Build an offline lesson from a trusted lesson adapter; never replace an existing file."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("lesson", type=Path, help="directory containing lesson.json and scene.js")
parser.add_argument("output", type=Path)
args = parser.parse_args()
config = json.loads((args.lesson / "lesson.json").read_text())
assets = ROOT / "assets"
def script(source):
    return "<script>" + source.replace("</script", "<\\/script") + "</script>"

history = [script((assets / "lesson-history.js").read_text())] if config.get("history") is True else []
if config.get("layout") == "workbench":
    parts = [(args.lesson / "lab.html").read_text(),
             "<!-- " + (assets / "vendor/THREE-LICENSE.txt").read_text() + " -->",
             script((assets / "vendor/three.js").read_text()),
             *history, script((args.lesson / "bench.js").read_text()),
             script((args.lesson / "lab.js").read_text()), "</body></html>"]
else:
    for field in ("title", "question", "control", "unit", "challenge", "limit"):
        if not isinstance(config.get(field), str) or not config[field].strip():
            parser.error(f"Missing text: {field}")
    if not config["min"] <= config["initial"] <= config["max"] or config["min"] >= config["max"]:
        parser.error("Invalid control range")
    parts = [(assets / "shell.html").read_text()]
    if config.get("three"):
        parts.append("<!-- " + (assets / "vendor/THREE-LICENSE.txt").read_text() + " -->")
        parts.append(script((assets / "vendor/three.js").read_text()))
    parts.extend([*history, script("const config = " + json.dumps(config, ensure_ascii=False)),
                  script((args.lesson / "scene.js").read_text()), script((assets / "runtime.js").read_text()),
                  "</body></html>"])
args.output.parent.mkdir(parents=True, exist_ok=True)
with args.output.open("x", encoding="utf-8") as destination:
    destination.write("\n".join(parts))
