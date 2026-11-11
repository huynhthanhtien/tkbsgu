# Xếp lịch

Chỉ làm sau khi người dùng đã xác nhận bảng môn.

## Quy tắc trùng tiết (giống hệt website)

Hai buổi trùng khi `thu` giống nhau và `max(tbd1, tbd2) <= min(tkt1, tkt2)`. Bỏ qua khoảng ngày `ngay`, kể cả khi hai lớp học khác tuần. Hai lớp trùng nếu **bất kỳ** cặp buổi nào trùng. Các phương án phải khác nhau ít nhất một lớp.

## Chế độ A: dùng `scripts/tkb.py`

Tải `scripts/tkb.py` từ thư mục skill. Chỉ cần Python 3, không cài gì thêm. Script tự thử GitHub rồi Vercel (đổi bằng `--base`, hoặc `--data-dir` cho thư mục cục bộ). Mọi lệnh in JSON; lỗi thoát mã khác 0.

```bash
python3 tkb.py search giai tich             # tìm mã môn (dùng để lập bảng xác nhận)
python3 tkb.py show 841404 841407           # lớp, lịch, giảng viên, cơ sở (co_so), dung_duoc
python3 tkb.py solve 841404 841407 801145 --confirmed -n 5 \
    --avoid-monday-morning --avoid-weekend --minimize-days \
    --campus cs1 --prefer-teacher "Đạt" --avoid-day "Thứ 7"
python3 tkb.py check --confirmed --s 841404,841407 --p 841404-01,841407-01 --p 841404-02,841407-01
```

`solve` và `check` **từ chối chạy** nếu thiếu `--confirmed`. Chỉ thêm cờ này sau khi người dùng đã duyệt bảng mã môn; không tự thêm để cho qua.

Cờ của `solve`: `--avoid-monday-morning`, `--avoid-morning`, `--avoid-afternoon`, `--avoid-weekend`, `--avoid-day "Thứ N"` (lặp lại được), `--minimize-days`, `--campus {cs1,cs2,main}`, `--prefer-teacher`, `--avoid-teacher`, `--no-diversify`, `--max-steps`.

- `solve` quay lui qua mọi lớp dùng được, xếp theo điểm phạt (thấp = tốt), tự kiểm tra lại và in `link`. `chua_dat` liệt kê ưu tiên bị vi phạm của từng phương án.
- `tim_kiem_bi_cat_som: true` nghĩa là chưa duyệt hết: không khẳng định kết quả tối ưu.
- Thoát mã 2 (không có phương án): nêu vấn đề, hỏi người dùng nới điều kiện nào hoặc bỏ môn nào; không tự làm thay.
- Ưu tiên không có cờ (VD “tối đa 3 buổi/ngày”, cơ sở bắt buộc hoặc nhiều cơ sở): lọc kết quả từ `show`, hoặc nói rõ là không kiểm tra được.
- **Đa dạng nhưng ưu tiên là trên hết:** `solve` chọn theo từng nhóm cùng điểm phạt, từ tốt đến kém; chỉ khi hết phương án ở nhóm tốt hơn mới sang nhóm kém hơn. Trong cùng nhóm, nó chọn các phương án khác nhau nhiều nhất về lớp và tập ngày học, nên không bao giờ hy sinh yêu cầu của người dùng chỉ để cho khác biệt. Khi tự xếp (chế độ B, C) cũng làm vậy: không đưa phương án kém ưu tiên hơn vào chỉ để tăng độ đa dạng. Chỉ có ít phương án khác biệt thật thì báo đúng số đó, đừng độn thêm phương án gần giống nhau.
- `search` khớp theo tên môn (hoặc đúng mã), số khớp nguyên từ, `II` = `2`, kết quả khớp chính xác xếp trước. Vẫn phải để người dùng xác nhận.

## Chế độ B và C: tự xếp

Chế độ B tải `subjects/<ma_mon>.json` từng môn; chế độ C chỉ dùng dữ liệu có trong cuộc trò chuyện (nếu có mục “TRÙNG VỚI” thì dựa vào đó). Thiếu dữ liệu môn nào thì yêu cầu người dùng dán thêm.

1. Loại lớp không có lịch hợp lệ và lớp vi phạm điều kiện bắt buộc.
2. Chọn lần lượt, bắt đầu từ môn ít lớp nhất. Sau mỗi lần chọn, loại các lớp trùng tiết với lớp vừa chọn. Môn nào hết lớp thì quay lui.
3. Xếp hạng theo ưu tiên mềm. Giới hạn số tổ hợp nếu cần và báo nếu dừng sớm.
4. Kiểm tra lại **từng cặp lớp** của mỗi phương án. Không đủ phương án thì báo số lượng thực tế.
