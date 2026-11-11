#!/usr/bin/env python3
"""Công cụ cho agent xếp thời khóa biểu SGU (chỉ dùng thư viện chuẩn Python 3.8+).

Lệnh:
  tkb.py search <từ khóa>...             tìm môn theo tên/mã (không phân biệt hoa thường, bỏ dấu)
  tkb.py show <ma_mon>...                liệt kê lớp, lịch, giảng viên, cơ sở của từng môn
  tkb.py solve <ma_mon>... [tùy chọn]    tìm tối đa N phương án hợp lệ, xếp theo ưu tiên, in link
  tkb.py check --s a,b --p a-01,b-01 [--p ...]   kiểm tra phương án có sẵn, in link

Nguồn dữ liệu (thử lần lượt, mặc định GitHub trước rồi Vercel; đổi bằng --base hoặc --data-dir):
  https://raw.githubusercontent.com/huynhthanhtien/tkbsgu/main/public/agent-data
  https://tkbsgu.vercel.app/agent-data
Mọi lệnh in JSON ra stdout; lỗi in ra stderr và thoát mã khác 0.
"""

import argparse
import itertools
import json
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

BASES = [
    "https://raw.githubusercontent.com/huynhthanhtien/tkbsgu/main/public/agent-data",
    "https://tkbsgu.vercel.app/agent-data",
]
SITE = "https://tkbsgu.vercel.app"
MAX_PLANS = 20
CODE_RE = re.compile(r"[A-Za-z0-9_-]+")


# ---------- Tải dữ liệu ----------
class Source:
    def __init__(self, bases, data_dir):
        self.bases = bases
        self.data_dir = data_dir
        self.used = None

    def get(self, rel):
        if self.data_dir:
            return json.loads((Path(self.data_dir) / rel).read_text(encoding="utf-8"))
        errors = []
        for base in ([self.used] if self.used else self.bases):
            url = f"{base.rstrip('/')}/{rel}"
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "tkbsgu-skill/1"})
                with urllib.request.urlopen(req, timeout=20) as r:
                    data = json.loads(r.read().decode("utf-8"))
                self.used = base
                return data
            except Exception as e:  # thử nguồn tiếp theo
                errors.append(f"{url}: {e}")
        raise SystemExit("Không tải được dữ liệu:\n  " + "\n  ".join(errors))

    def index(self):
        return self.get("index.json")

    def subject(self, code):
        if not CODE_RE.fullmatch(code):
            raise SystemExit(f"Mã môn không hợp lệ: {code!r}")
        return self.get(f"subjects/{code}.json")


# ---------- Tiện ích ----------
def fold(text):
    text = unicodedata.normalize("NFD", text.replace("đ", "d").replace("Đ", "D"))
    return "".join(c for c in text if unicodedata.category(c) != "Mn").lower()


ROMAN = {"i": "1", "ii": "2", "iii": "3", "iv": "4", "v": "5", "vi": "6"}


def tokens(text):
    """Tách từ không dấu; số La Mã (nguyên từ) đổi thành số: 'Giải tích II' -> ['giai','tich','2']."""
    return [ROMAN.get(t, t) for t in re.findall(r"[a-z0-9]+", fold(text))]


def search_subjects(index, query):
    """Khớp theo TÊN môn (hoặc mã nếu truy vấn là mã). Số phải khớp nguyên từ; chữ khớp tiền tố.
    Xếp: tên trùng hoàn toàn < tên bắt đầu bằng truy vấn < còn lại."""
    q = tokens(query)
    if not q:
        return []
    out = []
    for m in index:
        if fold(m["ma_mon"]) == fold(query).strip():
            out.append((-1, m))
            continue
        n = tokens(m["ten_mon"])
        ok = all(any(t == w or (not w.isdigit() and len(w) >= 2 and t.startswith(w)) for t in n) for w in q)
        if not ok:
            continue
        rank = 0 if n == q else 1 if n[: len(q)] == q else 2
        out.append((rank, m))
    out.sort(key=lambda x: (x[0], len(x[1]["ten_mon"])))
    return [m for _, m in out]


def campus(room):
    m = re.match(r"\s*Ph\s+([^.\s]+)\.", room or "", re.I)
    return {"1": "cs1", "2": "cs2", "C": "main"}.get(m.group(1).upper()) if m else None


def valid_session(t):
    return isinstance(t.get("tbd"), int) and isinstance(t.get("tkt"), int) and 1 <= t["tbd"] <= t["tkt"]


def sessions_overlap(a, b):
    # Giống website: cùng thứ và khoảng tiết giao nhau; bỏ qua khoảng ngày.
    return a["thu"] == b["thu"] and max(a["tbd"], b["tbd"]) <= min(a["tkt"], b["tkt"])


def classes_overlap(c1, c2):
    return any(sessions_overlap(a, b) for a in c1["tkb"] for b in c2["tkb"])


def usable(cls):
    """Lớp dùng được: có lịch và mọi buổi có tiết hợp lệ (loại 'Thứ 0', tkt=-1...)."""
    return bool(cls["tkb"]) and all(valid_session(t) for t in cls["tkb"])


def describe(subject, cls):
    days = {}
    for t in cls["tkb"]:
        days.setdefault(t["thu"], []).append(f"{t['tbd']}-{t['tkt']}")
    return {
        "id": f"{subject['ma_mon']}-{cls['nhom_to']}",
        "lich": {d: ", ".join(v) for d, v in days.items()},
        "co_so": sorted({campus(t.get("phong")) or (t.get("phong") or "?") for t in cls["tkb"]}),
        "giang_vien": sorted({t["giang_vien"].replace("GV ", "", 1) for t in cls["tkb"] if t.get("giang_vien")}),
        "dung_duoc": usable(cls),
    }


def build_link(codes, plans):
    q = [("s", ",".join(codes))] + [("p", ",".join(p)) for p in plans]
    return f"{SITE}/?" + urllib.parse.urlencode(q, safe=",")


def validate(subjects_by_code, codes, ids):
    """Trả về danh sách lỗi (rỗng nếu hợp lệ). Cùng quy tắc với website."""
    errors, chosen = [], {}
    for cid in ids:
        code, _, group = cid.partition("-")
        subj = subjects_by_code.get(code)
        if code not in codes:
            errors.append(f"{cid}: môn không nằm trong danh sách")
        elif subj is None:
            errors.append(f"{cid}: không có dữ liệu môn")
        else:
            cls = next((c for c in subj["lop"] if c["nhom_to"] == group), None)
            if cls is None:
                errors.append(f"{cid}: không có lớp này")
            elif code in chosen:
                errors.append(f"{code}: chọn nhiều hơn một lớp")
            elif not usable(cls):
                errors.append(f"{cid}: lớp không có lịch hợp lệ")
            else:
                chosen[code] = cls
    for code in codes:
        if code not in chosen:
            errors.append(f"{code}: thiếu lớp")
    items = list(chosen.items())
    for (c1, k1), (c2, k2) in itertools.combinations(items, 2):
        if classes_overlap(k1, k2):
            errors.append(f"{c1} và {c2} trùng tiết")
    return errors


# ---------- Chấm điểm ưu tiên (điểm càng thấp càng tốt) ----------
def penalty(chosen, a):
    """chosen: list[(subject, cls)]. Trả về (điểm phạt, danh sách ưu tiên bị vi phạm)."""
    pen, notes = 0, []
    days = set()
    for subj, cls in chosen:
        for t in cls["tkb"]:
            days.add(t["thu"])
            if a.avoid_monday_morning and t["thu"] == "Thứ 2" and t["tbd"] <= 5:
                pen += 150
                notes.append(f"{subj['ma_mon']} học sáng thứ 2")
            if a.avoid_morning and t["tbd"] <= 5:
                pen += 50
            if a.avoid_afternoon and t["tbd"] >= 6:
                pen += 50
            if a.avoid_weekend and t["thu"] in ("Thứ 7", "Chủ nhật"):
                pen += 100
                notes.append(f"{subj['ma_mon']} học {t['thu']}")
            if a.campus and (campus(t.get("phong")) or "?") != a.campus:
                pen += 30
            if a.avoid_day and t["thu"] in a.avoid_day:
                pen += 200
                notes.append(f"{subj['ma_mon']} học {t['thu']}")
        teachers = {fold(t.get("giang_vien", "")) for t in cls["tkb"]}
        for kw in a.prefer_teacher or []:
            if not any(fold(kw) in tn for tn in teachers):
                pen += 120
        for kw in a.avoid_teacher or []:
            if any(fold(kw) in tn for tn in teachers):
                pen += 120
    if a.minimize_days:
        pen += 40 * len(days)
    return pen, sorted(set(notes))


def signature(chosen):
    """(tập lớp, tập ngày học) của một phương án, để đo độ khác nhau."""
    ids = {f"{s['ma_mon']}-{c['nhom_to']}" for s, c in chosen}
    days = frozenset(t["thu"] for _, c in chosen for t in c["tkb"])
    return ids, days


def distance(x, y):
    # khác bao nhiêu lớp, cộng thêm nếu khác tập ngày học (khác kiểu lịch quan trọng hơn)
    return len(x[0] ^ y[0]) // 2 + (3 if x[1] != y[1] else 0)


def pick_diverse(scored, n, diversify=True):
    """Chọn n phương án. ƯU TIÊN LÀ TRÊN HẾT: duyệt theo từng nhóm cùng điểm phạt từ thấp đến cao,
    chỉ khi hết phương án ở nhóm tốt hơn mới sang nhóm kém hơn. Trong cùng một nhóm điểm mới
    chọn theo kiểu 'xa nhất' để các phương án khác nhau về lớp và ngày học."""
    picked, i = [], 0
    while i < len(scored) and len(picked) < n:
        j = i
        while j < len(scored) and scored[j][0][0] == scored[i][0][0]:
            j += 1
        tier = [(sc, ch, signature(ch)) for sc, ch in scored[i:j]]
        i = j
        while tier and len(picked) < n:
            if not diversify or not picked:
                best = 0
            else:
                best = max(range(len(tier)),
                           key=lambda k: min(distance(tier[k][2], p[2]) for p in picked))
            picked.append(tier.pop(best))
    return [(sc, ch) for sc, ch, _ in picked]


def solve(subjects, a):
    pools = []
    for s in subjects:
        cands = [c for c in s["lop"] if usable(c)]
        if not cands:
            raise SystemExit(f"Môn {s['ma_mon']} không có lớp nào dùng được (không lịch hoặc tiết không hợp lệ).")
        pools.append((s, cands))
    pools.sort(key=lambda p: len(p[1]))  # môn ít lớp nhất trước
    results, steps, truncated = [], [0], [False]
    limit = a.max_steps

    def rec(i, chosen):
        if truncated[0]:
            return
        if i == len(pools):
            results.append(list(chosen))
            return
        subj, cands = pools[i]
        for cls in cands:
            steps[0] += 1
            if steps[0] > limit:
                truncated[0] = True
                return
            if all(not classes_overlap(cls, k) for _, k in chosen):
                chosen.append((subj, cls))
                rec(i + 1, chosen)
                chosen.pop()

    rec(0, [])
    scored = sorted(((penalty(r, a), r) for r in results), key=lambda x: x[0][0])
    return scored, len(results), truncated[0]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base", action="append", help="URL gốc agent-data (có thể lặp lại, thử theo thứ tự)")
    ap.add_argument("--data-dir", help="thư mục agent-data cục bộ thay cho mạng")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("search")
    p.add_argument("query", nargs="+")
    p.add_argument("--limit", type=int, default=15)

    p = sub.add_parser("show")
    p.add_argument("codes", nargs="+")

    p = sub.add_parser("solve")
    p.add_argument("codes", nargs="+")
    p.add_argument("-n", "--plans", type=int, default=5)
    p.add_argument("--avoid-monday-morning", action="store_true")
    p.add_argument("--avoid-morning", action="store_true")
    p.add_argument("--avoid-afternoon", action="store_true")
    p.add_argument("--avoid-weekend", action="store_true")
    p.add_argument("--avoid-day", action="append", help='VD: "Thứ 7" (lặp lại được)')
    p.add_argument("--minimize-days", action="store_true")
    p.add_argument("--campus", choices=["cs1", "cs2", "main"])
    p.add_argument("--prefer-teacher", action="append", help="một phần tên giảng viên")
    p.add_argument("--avoid-teacher", action="append")
    p.add_argument("--no-diversify", action="store_true",
                   help="tắt chọn đa dạng; chỉ lấy theo điểm phạt")
    p.add_argument("--max-steps", type=int, default=2_000_000)

    p = sub.add_parser("check")
    p.add_argument("--s", required=True, help="mã môn, cách nhau dấu phẩy")
    p.add_argument("--p", action="append", required=True, help="ID lớp của một phương án (lặp lại)")

    a = ap.parse_args()
    src = Source(a.base or BASES, a.data_dir)

    if a.cmd == "search":
        hits = search_subjects(src.index(), " ".join(a.query))
        print(json.dumps({"so_ket_qua": len(hits), "ket_qua": hits[: a.limit]}, ensure_ascii=False, indent=1))
        return

    if a.cmd == "show":
        out = []
        for code in a.codes:
            s = src.subject(code)
            out.append({"ma_mon": code, "ten_mon": s["ten_mon"], "so_tc": s["so_tc"],
                        "lop": [describe(s, c) for c in s["lop"]]})
        print(json.dumps(out, ensure_ascii=False, indent=1))
        return

    if a.cmd == "solve":
        codes = a.codes
        if len(set(codes)) != len(codes):
            raise SystemExit("Mã môn bị trùng.")
        if not 1 <= a.plans <= MAX_PLANS:
            raise SystemExit(f"Số phương án phải từ 1 đến {MAX_PLANS}.")
        subjects = [src.subject(c) for c in codes]
        scored, total, truncated = solve(subjects, a)
        if not scored:
            print(json.dumps({"hop_le": 0, "bi_cat": truncated,
                              "ghi_chu": "Không có phương án đủ môn không trùng tiết. Hỏi người dùng muốn nới điều kiện/bỏ môn nào."},
                             ensure_ascii=False, indent=1))
            sys.exit(2)
        order = {s["ma_mon"]: i for i, s in enumerate(subjects)}
        plans = []
        for (pen, notes), chosen in pick_diverse(scored, a.plans, not a.no_diversify):
            chosen.sort(key=lambda sc: order[sc[0]["ma_mon"]])
            plans.append({"ids": [f"{s['ma_mon']}-{c['nhom_to']}" for s, c in chosen],
                          "diem_phat": pen, "chua_dat": notes})
        for plan in plans:
            errs = validate({s["ma_mon"]: s for s in subjects}, codes, plan["ids"])
            assert not errs, errs
        credits = sum(int(s["so_tc"]) for s in subjects if str(s["so_tc"]).isdigit())
        print(json.dumps({
            "nguon_du_lieu": src.used or a.data_dir,
            "so_mon": len(codes), "tong_tin_chi": credits,
            "to_hop_hop_le_tim_thay": total, "tim_kiem_bi_cat_som": truncated,
            "phuong_an": plans,
            "link": build_link(codes, [p["ids"] for p in plans]),
        }, ensure_ascii=False, indent=1))
        return

    if a.cmd == "check":
        codes = [c.strip() for c in a.s.split(",") if c.strip()]
        plans = [[x.strip() for x in p.split(",") if x.strip()] for p in a.p]
        if len(plans) > MAX_PLANS:
            raise SystemExit(f"Tối đa {MAX_PLANS} phương án.")
        subjects = {c: src.subject(c) for c in codes}
        report = [{"phuong_an": i + 1, "loi": validate(subjects, codes, ids)} for i, ids in enumerate(plans)]
        ok = all(not r["loi"] for r in report)
        print(json.dumps({"hop_le": ok, "bao_cao": report,
                          "link": build_link(codes, plans) if ok else None}, ensure_ascii=False, indent=1))
        sys.exit(0 if ok else 2)


if __name__ == "__main__":
    main()
