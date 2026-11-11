---
name: xep-tkb-sgu
description: Xếp thời khóa biểu SGU (nhiều phương án, không trùng tiết) từ danh sách môn và mong muốn của người dùng, rồi tạo link để mở trên website. Dùng cho cả AI agent có công cụ lẫn chatbot thuần chat. Dùng khi người dùng muốn xếp, đổi hoặc so sánh thời khóa biểu SGU.
---

# Xếp thời khóa biểu SGU

Mục tiêu: với danh sách môn và mong muốn của người dùng, đưa ra **tối đa 20 phương án** (mặc định 5), mỗi phương án có **đúng một lớp cho mỗi môn**, không trùng tiết, và trả **một link** `https://tkbsgu.vercel.app/?s=...&p=...` để người dùng xem và lưu. Không cần API key hay MCP.

## 0. Chọn chế độ (làm trước tiên)

| Bạn có gì | Chế độ |
|---|---|
| Tải được URL **và** chạy được Python/code | **A – Agent đầy đủ**: dùng `scripts/tkb.py` (mục 3A) |
| Tải được URL nhưng không chạy code | **B – Agent đọc dữ liệu**: tải JSON, tự xếp và tự kiểm tra từng cặp (mục 3B) |
| Không tải được URL (chatbot thuần chat) | **C – Chatbot**: dùng dữ liệu người dùng dán vào (mục 3C) |

Chế độ C thường bắt đầu từ nút **Prompt AI** trong trang thời khóa biểu của website: prompt đó đã chứa dữ liệu thật và danh sách lớp trùng sẵn. Nếu người dùng chưa có, hướng dẫn họ dùng nút đó (hoặc dán dữ liệu môn vào chat). **Không bao giờ bịa mã môn, mã lớp hay lịch.** Nếu thiếu dữ liệu để chắc chắn, nói rõ và dừng.

## 1. Dữ liệu

Nguồn (thử lần lượt, dùng nguồn đầu tiên tải được):

1. `https://raw.githubusercontent.com/huynhthanhtien/tkbsgu/main/public/agent-data/` (GitHub, ít bị chặn)
2. `https://tkbsgu.vercel.app/agent-data/` (dự phòng)

- `index.json`: mảng `{ma_mon, ten_mon, so_tc}`; chỉ dùng mã có ở đây.
- `subjects/<ma_mon>.json`: `{ma_mon, ten_mon, so_tc, lop:[{nhom_to, tkb:[{thu, tbd, tkt, phong, giang_vien, ngay?}]}]}`. Chỉ tải những môn cần dùng.
- ID lớp = `<ma_mon>-<nhom_to>`, ví dụ `841404-01`.
- `thu` là `"Thứ 2"`…`"Thứ 7"`, `"Chủ nhật"`. Tiết 1–5 là sáng, 6–10 là chiều. Cơ sở suy từ `phong`: `Ph 1.x` = CS1, `Ph 2.x` = CS2, `Ph C.x` = cơ sở chính.
- Lớp có `thu` = `"Thứ 0"`, `tbd` = 0 hoặc `tkt` < `tbd` là **chưa có lịch**: không xếp lớp đó (và nói với người dùng nếu môn không còn lớp nào).
- Dữ liệu **không** cho biết còn chỗ đăng ký hay không, và có thể không đúng học kỳ người dùng cần. Nếu học kỳ quan trọng, hỏi người dùng; thông tin học kỳ tham khảo ở `https://tkbsgu.vercel.app/tkb.json` (`hocKi`, `thoiGianCapNhat`), không phải lúc nào cũng khớp.

## 2. Hỏi người dùng (hỏi gộp một lần, không hỏi lại điều đã biết)

- **Môn**: nếu chưa có danh sách, hỏi tên hoặc mã môn. Tên mơ hồ hoặc nhiều kết quả → liệt kê kèm mã để họ chọn. Không tìm thấy → hỏi lại; không tự thay hay bỏ môn.
- **Mong muốn**: nếu chưa nói, hỏi một câu mở: *“Bạn muốn thời khóa biểu như thế nào? Có lưu ý gì về ngày, giờ, giảng viên, cơ sở hoặc cách sắp xếp không?”*
- Tách **bắt buộc** (cứng) và **ưu tiên** (mềm). Yêu cầu mơ hồ ảnh hưởng kết quả thì hỏi lại.
- Số phương án mặc định 5, tối đa 20; yêu cầu nhiều hơn thì giải thích và hỏi có lấy 20 không.

Thứ tự khi mâu thuẫn: ràng buộc cứng (đủ môn, không trùng tiết, điều kiện bắt buộc) > yêu cầu cụ thể của người dùng (giảng viên, môn…) > mong muốn chung (tránh sáng thứ 2, tránh cuối tuần, cơ sở, gom ít ngày…). Ví dụ: người dùng thích một giảng viên mà lớp đó buộc học thứ 7 → chọn lớp đó và nói rõ đã hy sinh “tránh thứ 7”.

## 3. Xếp lịch

Quy tắc **trùng tiết** (giống hệt website): hai buổi trùng khi `thu` giống nhau và `max(tbd1,tbd2) <= min(tkt1,tkt2)`. Bỏ qua khoảng ngày `ngay`, kể cả khi hai lớp học khác tuần. Hai lớp trùng nếu **bất kỳ** cặp buổi nào trùng. Các phương án phải khác nhau ít nhất một lớp.

### 3A. Có code: dùng `scripts/tkb.py`

Tải script từ cùng thư mục skill (`.../skills/xep-tkb-sgu/scripts/tkb.py`), chỉ cần Python 3, không cài gì thêm. Script tự thử GitHub rồi Vercel.

```bash
python3 tkb.py search giai tich             # tìm mã môn
python3 tkb.py show 841404 841407           # xem lớp, lịch, giảng viên, cơ sở
python3 tkb.py solve 841404 841407 801145 -n 5 \
    --avoid-monday-morning --avoid-weekend --minimize-days \
    --campus cs1 --prefer-teacher "Đạt" --avoid-day "Thứ 7"
python3 tkb.py check --s 841404,841407 --p 841404-01,841407-01 --p 841404-02,841407-01
```

`solve` quay lui toàn bộ lớp dùng được, xếp theo điểm phạt (thấp = tốt) rồi tự kiểm tra lại và in `link`. `chua_dat` liệt kê ưu tiên bị vi phạm của từng phương án. Nếu `tim_kiem_bi_cat_som` là `true`, không khẳng định kết quả tối ưu. Nếu thoát mã 2 (không có phương án), trình bày vấn đề và hỏi người dùng muốn nới điều kiện nào hoặc bỏ môn nào; không tự làm thay. Ưu tiên chưa có cờ (ví dụ “học tối đa 3 buổi/ngày”) thì tự lọc kết quả từ `show`, hoặc nói rõ là không kiểm tra được.

### 3B. Không có code: tự xếp

1. Tải `subjects/<ma_mon>.json` cho từng môn.
2. Loại lớp không có lịch hợp lệ và lớp vi phạm điều kiện bắt buộc.
3. Chọn lần lượt, bắt đầu từ môn ít lớp nhất; sau mỗi lần chọn loại các lớp trùng tiết với lớp vừa chọn; hết lớp thì quay lui.
4. Với mỗi phương án, **kiểm tra lại từng cặp lớp** theo quy tắc trùng tiết trước khi đưa vào kết quả. Không đủ phương án thì báo số lượng thực tế.

### 3C. Chatbot không tải được dữ liệu

Chỉ dùng dữ liệu có trong cuộc trò chuyện (prompt từ website hoặc dữ liệu người dùng dán). Làm như 3B, dựa vào mục “TRÙNG VỚI” nếu có. Nếu thiếu dữ liệu của môn nào, nói rõ và yêu cầu người dùng dán thêm, hoặc dùng nút **Prompt AI** của website.

## 4. Kiểm tra trước khi trả lời

Cho **từng** phương án: mọi mã môn và lớp tồn tại; đủ đúng một lớp cho mỗi môn; không có cặp lớp nào trùng tiết; thỏa mọi điều kiện bắt buộc. Không tuyên bố đã đáp ứng điều bạn không kiểm tra được. Không có phương án đủ môn thì **không tạo link**; trình bày vấn đề và hỏi người dùng nới điều kiện nào. Không tự bỏ môn.

## 5. Định dạng kết quả (một định dạng cho mọi chế độ)

Link, mỗi `p` là một phương án gồm ID lớp, phân cách bằng dấu phẩy; `s` là các mã môn:

```text
https://tkbsgu.vercel.app/?s=841404,841407&p=841404-01,841407-01&p=841404-02,841407-01
```

- Tối đa 20 `p`; mọi `p` phải hợp lệ, một `p` sai thì website từ chối cả link. Không trộn `p` với `i`, `code`, `checksum`.
- Chế độ A/B tạo link bằng thư viện URL; chỉ dùng dấu phẩy và gạch ngang nên chatbot tự viết được.
- **Chatbot**: ngoài link, kết thúc câu trả lời bằng một khối JSON để người dùng dán vào ô kết quả của nút Prompt AI (website cũng đọc được cả link ở trên khi dán vào ô đó):

  ```json
  {"plans": [{"name": "Phương án 1", "note": "đạt: …; hy sinh: …", "i": ["841404-01", "841407-01"]}]}
  ```

Nội dung trả lời: **một link**, số môn, tổng tín chỉ (mỗi môn cộng một lần), số phương án thực tế, ưu tiên đã đạt / chưa đạt / không kiểm tra được, và cho biết nếu tìm kiếm bị cắt sớm. Hướng dẫn người dùng: mở link, đặt tên, bấm **Lưu**, rồi chọn phương án xem thử và bấm **Áp dụng**. Lịch lưu trong trình duyệt của họ; link không lưu tên hay ghi chú. Website kiểm tra lại khi mở; nếu dữ liệu lớp đổi sau này, link có thể không còn hợp lệ.
