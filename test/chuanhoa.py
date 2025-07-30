import json

start_times = ["07:00", "07:50", "09:00", "09:50", "10:40", "13:00", "13:50", "15:00", "15:50", "16:40"]
end_times   = ["07:50", "08:40", "09:50", "10:40", "11:30", "13:50", "14:40", "15:50", "16:40", "17:30"]

def tim_tiet(gio, ds_gio):
    for i, g in enumerate(ds_gio):
        if gio == g:
            return i + 1
    return -1

def them_tiet_vao_tkb(ds_mon):
    for mon in ds_mon:
        print(mon["ma_mon"])
        for tkb in mon.get("tkb", []):
            try:
                time_range = tkb.get("thoi_gian", "")
                gio_bd, gio_kt = [s.strip().replace("từ ", "").replace("đến ", "") for s in time_range.split("đến")]
                tbd = tim_tiet(gio_bd, start_times)
                tkt = tim_tiet(gio_kt, end_times)
                if tbd == -1 or tkt == -1:
                    print(f"⚠️ Không tìm thấy tiết phù hợp cho thời gian: {gio_bd} - {gio_kt}")
                tkb["tbd"] = tbd
                tkb["tkt"] = tkt
            except Exception as e:
                print("Lỗi khi xử lý môn:", mon.get("ma_mon"), e)
                tkb["tbd"] = 1
                tkb["tkt"] = 10
    return ds_mon

def group_subjects_by_ma_mon(data):
    grouped = {}

    for item in data:
        key = item["ma_mon"]

        if key not in grouped:
            grouped[key] = {
                "ma_mon": item["ma_mon"],
                "ten_mon": item["ten_mon"],
                "so_tc": item["so_tc"],
                "lop": []
            }

        grouped[key]["lop"].append({
            "nhom_to": item["nhom_to"],
            # "so_tc": item["so_tc"],
            "tkb": item["tkb"]
        })

    return list(grouped.values())

# Đọc file JSON
with open("./dsCustom.json", "r", encoding="utf-8") as f:
    ds_mon = json.load(f)

# Xử lý
ds_mon = group_subjects_by_ma_mon(them_tiet_vao_tkb(ds_mon))

# Ghi ra file mới
with open("output.json", "w", encoding="utf-8") as f:
    json.dump(ds_mon, f, ensure_ascii=False, indent=2)

print("✅ Đã xử lý và lưu vào output.json")
