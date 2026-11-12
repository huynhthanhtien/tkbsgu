#!/usr/bin/env python3
"""Chuyển dữ liệu đăng ký môn học thành dữ liệu web."""
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TIMES = {1: '07:00', 2: '07:50', 3: '09:00', 4: '09:50', 5: '10:40', 6: '13:00', 7: '13:50', 8: '15:00', 9: '15:50', 10: '16:40', 11: '17:40', 12: '18:30', 13: '19:20'}
FIELDS = ('to', 'ds_lop', 'ds_khoa', 'sl_dk', 'sl_cp', 'sl_cl')

def parse_schedule(value):
    sessions = []
    for text in re.split(r'<hr\s*/?>', value or '', flags=re.I):
        match = re.search(r'(Thứ\s*\d|Chủ nhật)\s*,\s*tiết\s*(\d+)\s*->\s*(\d+)', text, re.I)
        if not match:
            continue
        day, start, end = match.group(1), int(match.group(2)), int(match.group(3))
        parts = [part.strip() for part in text[match.end():].strip(' ,').split(',')]
        room = next((part for part in parts if part.startswith('Ph ')), '')
        teacher = next((part for part in parts if part.startswith('GV ')), '')
        date = next((part for part in parts if re.search(r'\d{2}/\d{2}/\d{2}', part)), '')
        sessions.append({'thu': day, 'thoi_gian': f'từ {TIMES[start]} đến {TIMES[end]}' if start in TIMES and end in TIMES else '', 'phong': room, 'giang_vien': teacher, 'ngay': date, 'tbd': start, 'tkt': end})
    return sessions

def main():
    data = json.loads((ROOT / 'test/w-locdsnhomto.json').read_text(encoding='utf-8'))['data']
    names = {x['ma']: x['ten'] for x in data['ds_mon_hoc']}
    groups = defaultdict(list)
    for group in data['ds_nhom_to']:
        groups[(group['ma_mon'], group['nhom_to'])].append(group)
    subjects = {}
    split_groups = 0
    for (code, number), options in groups.items():
        first = options[0]
        subject = subjects.setdefault(code, {'ma_mon': code, 'ten_mon': first.get('ten_mon') or names.get(code, ''), 'so_tc': first.get('so_tc', ''), 'lop': []})
        if len(options) > 1:
            split_groups += 1
        for option in options:
            # Giữ ID cũ cho nhóm chỉ có một tổ; phân biệt tổ khi có nhiều lựa chọn.
            group_id = number if len(options) == 1 else f"{number}-{option['to']}"
            cls = {'nhom_to': group_id, 'tkb': parse_schedule(option.get('tkb'))}
            cls.update({key: option.get(key) for key in FIELDS})
            subject['lop'].append(cls)
    result = {'hoc_ky_dang_ky': data.get('hoc_ky_dang_ky', ''), 'mon_hoc': list(subjects.values())}
    (ROOT / 'public/data.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(f"Đã nhập {len(subjects)} môn; tách {split_groups} nhóm có nhiều tổ.")

if __name__ == '__main__':
    main()
