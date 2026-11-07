import json
from datetime import datetime, timedelta

# Bản đồ thời gian bắt đầu của các tiết học
START_TIMES = {
    1: "07:00", 2: "07:50", 3: "09:00", 4: "09:50", 5: "10:40",
    6: "13:00", 7: "13:50", 8: "15:00", 9: "15:50", 10: "16:40",
    11: "17:40", 12: "18:30", 13: "19:20"
}

# Bản đồ thứ trong tuần
THU_MAP = {
    2: "Thứ 2",
    3: "Thứ 3",
    4: "Thứ 4",
    5: "Thứ 5",
    6: "Thứ 6",
    7: "Thứ 7",
    8: "Chủ nhật"
}

def get_week_ranges(weeks):
    """Gộp các tuần liên tiếp thành các khoảng (start_week, end_week)"""
    if not weeks:
        return []
    sorted_weeks = sorted(weeks)
    ranges = []
    start = sorted_weeks[0]
    prev = sorted_weeks[0]
    
    for w in sorted_weeks[1:]:
        if w == prev + 1:
            prev = w
        else:
            ranges.append((start, prev))
            start = w
            prev = w
    ranges.append((start, prev))
    return ranges

def convert_raw_to_data(raw_filepath, output_filepath):
    # Đọc dữ liệu thô từ file raw_data.json
    with open(raw_filepath, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    # Lấy ngày bắt đầu tuần 1 của TKB
    base_date_str = raw_data.get("ngayBatDauTKB", "07/09/2026")
    base_date = datetime.strptime(base_date_str, "%d/%m/%Y")

    grouped_data = {}

    for hp in raw_data.get("listHocPhan", []):
        ma_mon = str(hp.get("maMon", "")).strip()
        ten_mon = str(hp.get("tenMon", "")).strip()
        so_tc = str(hp.get("soTc", ""))
        nhom_to = str(hp.get("tenNhom", "")).strip()
        
        if ma_mon not in grouped_data:
            grouped_data[ma_mon] = {
                "ma_mon": ma_mon,
                "ten_mon": ten_mon,
                "so_tc": so_tc,
                "lop": []
            }
        
        # Tìm nhóm tổ đã tồn tại trong danh sách lớp hay chưa
        lop_item = None
        for l in grouped_data[ma_mon]["lop"]:
            if l["nhom_to"] == nhom_to:
                lop_item = l
                break
        
        if not lop_item:
            lop_item = {
                "nhom_to": nhom_to,
                "tkb": []
            }
            grouped_data[ma_mon]["lop"].append(lop_item)
        
        for l in hp.get("lich", []):
            thu_num = l.get("thu")
            thu_str = THU_MAP.get(thu_num, f"Thứ {thu_num}")
            
            tiet_bd = l.get("tietBd", 0)
            so_tiet = l.get("soTiet", 0)
            
            if tiet_bd > 0 and so_tiet > 0:
                tbd = tiet_bd
                tkt = tiet_bd + so_tiet - 1
            else:
                tbd = 0
                tkt = -1
            
            # Tính thời gian (VD: từ 07:50 đến 10:40)
            if tbd in START_TIMES and tkt in START_TIMES:
                thoi_gian = f"từ {START_TIMES[tbd]} đến {START_TIMES[tkt]}"
            else:
                thoi_gian = ""
            
            # Định dạng phòng và giảng viên
            ten_phong = l.get("tenPhong") or ""
            phong = f"Ph {ten_phong}" if ten_phong and not ten_phong.startswith("Ph ") else ten_phong
            
            ten_gv = l.get("tenGv") or ""
            giang_vien = f"GV {ten_gv}" if ten_gv and not ten_gv.startswith("GV ") else ten_gv
            
            # Xử lý thời gian các tuần
            weeks = l.get("thoiGian", [])
            week_ranges = get_week_ranges(weeks)
            
            if not week_ranges:
                lop_item["tkb"].append({
                    "thu": thu_str,
                    "thoi_gian": thoi_gian,
                    "phong": phong,
                    "giang_vien": giang_vien,
                    "ngay": "",
                    "tbd": tbd,
                    "tkt": tkt
                })
            else:
                for w_start, w_end in week_ranges:
                    if thu_num in THU_MAP:
                        day_offset = thu_num - 2
                        s_dt = base_date + timedelta(weeks=w_start - 1, days=day_offset)
                        e_dt = base_date + timedelta(weeks=w_end - 1, days=day_offset)
                        ngay_str = f"{s_dt.strftime('%d/%m/%y')} đến {e_dt.strftime('%d/%m/%y')}"
                    else:
                        ngay_str = ""
                    
                    lop_item["tkb"].append({
                        "thu": thu_str,
                        "thoi_gian": thoi_gian,
                        "phong": phong,
                        "giang_vien": giang_vien,
                        "ngay": ngay_str,
                        "tbd": tbd,
                        "tkt": tkt
                    })

    final_result = list(grouped_data.values())

    # Ghi kết quả ra file data.json
    with open(output_filepath, "w", encoding="utf-8") as f:
        json.dump(final_result, f, ensure_ascii=False, indent=2)

    print(f"✅ Đã chuyển đổi thành công {len(final_result)} môn học và lưu vào {output_filepath}")

if __name__ == "__main__":
    import os
    import sys
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    if len(sys.argv) > 1:
        raw_path = sys.argv[1]
    else:
        tkb_candidate = os.path.join(script_dir, "public", "tkb.json")
        raw_data_candidate = os.path.join(script_dir, "public", "raw_data.json")
        raw_path = tkb_candidate if os.path.exists(tkb_candidate) else raw_data_candidate

    output_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(script_dir, "public", "data.json")
    print(f"Bắt đầu chuyển đổi: {raw_path} -> {output_path}")
    convert_raw_to_data(raw_path, output_path)
