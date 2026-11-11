# Dữ liệu SGU

## Nguồn (thử lần lượt, dùng nguồn đầu tiên tải được)

1. `https://raw.githubusercontent.com/huynhthanhtien/tkbsgu/main/public/agent-data/` (GitHub, ít bị chặn)
2. `https://tkbsgu.vercel.app/agent-data/` (dự phòng)

Nếu không tải được cả hai, nói với người dùng và chuyển sang chế độ C. Không tự bịa dữ liệu.

## Tệp

- `index.json`: mảng `{ma_mon, ten_mon, so_tc}`. Chỉ dùng mã có trong danh mục này.
- `subjects/<ma_mon>.json`: một môn, ví dụ `subjects/841404.json`. Chỉ tải những môn cần dùng.

```json
{"ma_mon":"801022","ten_mon":"Đại số đại cương","so_tc":"4",
 "lop":[{"nhom_to":"01","tkb":[
   {"thu":"Thứ 2","tbd":3,"tkt":5,"phong":"Ph 1.C202","giang_vien":"GV Chế Thị Kim Phụng",
    "thoi_gian":"từ 09:00 đến 10:40","ngay":"04/01/27 đến 12/04/27"}]}]}
```

- ID lớp = `<ma_mon>-<nhom_to>`, ví dụ `841404-01`.
- `thu`: `"Thứ 2"` … `"Thứ 7"`, `"Chủ nhật"`.
- `tbd` / `tkt`: tiết bắt đầu / kết thúc. Tiết 1-5 là sáng, 6-10 là chiều.
- `so_tc` là chuỗi; cộng tín chỉ mỗi môn đúng một lần.
- Cơ sở suy từ `phong`: `Ph 1.x` = CS1, `Ph 2.x` = CS2, `Ph C.x` = cơ sở chính. Tên phòng khác thì cơ sở là **không xác định**.

## Điểm bất thường

- Lớp có `thu` = `"Thứ 0"`, `tbd` = 0 hoặc `tkt` < `tbd` là **chưa có lịch** (VD `802114-01`): không xếp lớp đó. Môn không còn lớp nào dùng được thì báo người dùng.
- Mã môn có thể chứa chữ (VD `BOBA11`).
- Nhiều tên môn trùng nhau nhưng khác mã (VD “Cấu trúc dữ liệu và giải thuật” có hai mã); đây là lý do phải xác nhận môn.

## Học kỳ

`https://tkbsgu.vercel.app/tkb.json` có `hocKi` và `thoiGianCapNhat`, nhưng không phải lúc nào cũng khớp với `agent-data`. Dùng để tham khảo; nếu học kỳ quan trọng và không chắc, hỏi người dùng. Dữ liệu `agent-data` không có số chỗ còn trống.
