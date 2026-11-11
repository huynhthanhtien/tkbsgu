#!/usr/bin/env python3
"""Create a subject index and individual JSON files without changing data.json."""

import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=ROOT / "public/data.json")
    parser.add_argument("--output", type=Path, default=ROOT / "public/agent-data")
    args = parser.parse_args()

    source = args.input.resolve()
    output = args.output.resolve()
    if source == output or source.is_relative_to(output):
        parser.error("The input file must be outside the output directory.")

    with source.open(encoding="utf-8") as file:
        subjects = json.load(file)
    if not isinstance(subjects, list):
        parser.error("The input must be an array of subjects.")

    index = []
    seen = set()
    for subject in subjects:
        if not isinstance(subject, dict):
            parser.error("Each subject must be an object.")
        code = subject.get("ma_mon")
        if not isinstance(code, str) or not re.fullmatch(r"[A-Za-z0-9_-]+", code):
            parser.error(f"Invalid subject code: {code!r}")
        if code in seen:
            parser.error(f"Duplicate subject code: {code}")
        if not isinstance(subject.get("ten_mon"), str) or not isinstance(subject.get("lop"), list):
            parser.error(f"Invalid subject data: {code}")
        seen.add(code)
        index.append({"ma_mon": code, "ten_mon": subject["ten_mon"], "so_tc": subject.get("so_tc")})

    subject_dir = output / "subjects"
    subject_dir.mkdir(parents=True, exist_ok=True)
    for subject in subjects:
        path = subject_dir / f"{subject['ma_mon']}.json"
        path.write_text(json.dumps(subject, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    (output / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"
    )
    print(f"Đã tạo danh mục và {len(index)} file môn học trong {output}")
    print("File dữ liệu gốc không thay đổi. Chỉ dùng mã có trong index.json.")


if __name__ == "__main__":
    main()
