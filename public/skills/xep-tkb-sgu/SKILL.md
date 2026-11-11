---
name: xep-tkb-sgu
description: Xếp thời khóa biểu (TKB) Đại học Sài Gòn (SGU) thành nhiều phương án không trùng tiết từ danh sách môn và mong muốn của người dùng (ngày, giờ, cơ sở, giảng viên, ít ngày học), rồi tạo link mở trên website tkbsgu.vercel.app. Dùng cho cả agent có công cụ lẫn chatbot thuần chat. Dùng khi người dùng muốn xếp, đổi, so sánh hoặc kiểm tra thời khóa biểu SGU, đăng ký học phần, chọn lớp/nhóm tổ. Luôn xác nhận mã môn với người dùng trước khi xếp. Not for other universities.
compatibility: Cần tải được URL công khai (GitHub raw hoặc Vercel) để dùng dữ liệu trực tiếp; chạy được Python 3 (chỉ thư viện chuẩn) thì dùng thêm scripts/tkb.py. Không có hai thứ trên thì chỉ dùng dữ liệu người dùng dán vào cuộc trò chuyện.
metadata:
  version: "2.0"
  site: https://tkbsgu.vercel.app
  repo: https://github.com/huynhthanhtien/tkbsgu
---

# Xếp thời khóa biểu SGU

> **QUY TẮC BẮT BUỘC, ĐỌC TRƯỚC:** Trước khi xếp lịch hoặc tạo link, bạn **phải** gửi cho người dùng bảng xác nhận môn (`bạn gõ → mã môn, tên môn, tín chỉ`, liệt kê mọi ứng viên khi tên khớp nhiều mã) rồi **dừng và chờ họ trả lời**. Không tự chọn mã môn thay người dùng, kể cả khi chỉ khớp một kết quả hay có vẻ hiển nhiên. Bỏ qua bước này là làm sai nhiệm vụ, dù lịch xếp đúng.
>
> **Tên môn luôn ghi đầy đủ, nguyên văn từ `index.json` (`ten_mon`) kèm mã môn**, ví dụ “Xác suất thống kê A (864001)”. Không viết tắt, không dùng cách gọi của người dùng (“xstk”, “ctdl”, “giải tích 2”), không tự rút gọn hay diễn đạt lại. Ở mọi nơi hiển thị môn (bảng xác nhận, kết quả, mô tả phương án) chỉ dùng tên chính thức; cách gọi của người dùng chỉ nằm ở cột “bạn gõ” của bảng xác nhận.

Đầu ra: **tối đa 20 phương án** (mặc định 5), mỗi phương án có **đúng một lớp cho mỗi môn**, không trùng tiết, và **một link** `https://tkbsgu.vercel.app/?s=<các mã môn>&p=<ID lớp,...>&p=...` để người dùng xem và lưu. Không cần API key hay MCP.

Tệp đi kèm (đường dẫn tương đối so với thư mục chứa SKILL.md; cơ sở URL là `https://raw.githubusercontent.com/huynhthanhtien/tkbsgu/main/public/skills/xep-tkb-sgu/`, dự phòng `https://tkbsgu.vercel.app/skills/xep-tkb-sgu/`):

- [references/data.md](references/data.md): nguồn dữ liệu, cấu trúc JSON, các điểm bất thường.
- [references/preferences.md](references/preferences.md): câu hỏi người dùng, cơ sở, thứ tự ưu tiên.
- [references/solving.md](references/solving.md): cách xếp (script `scripts/tkb.py` hoặc tự làm), quy tắc trùng tiết.
- [references/output.md](references/output.md): định dạng link, nội dung câu trả lời.
- [scripts/tkb.py](scripts/tkb.py): công cụ Python 3 (`search`, `show`, `solve`, `check`).

## Chọn chế độ

| Có gì | Chế độ |
|---|---|
| Tải được URL và chạy được code | **A**: dùng `scripts/tkb.py` |
| Tải được URL, không chạy code | **B**: tải JSON, tự xếp và tự kiểm tra từng cặp lớp |
| Không tải được URL (chatbot) | **C**: chỉ dùng dữ liệu người dùng dán vào cuộc trò chuyện; yêu cầu họ dán nội dung `index.json` và các `subjects/<ma_mon>.json` cần dùng |

**Không bao giờ bịa mã môn, mã lớp, lịch hay link.** Thiếu dữ liệu để chắc chắn thì nói rõ và dừng.

## Quy trình

1. **Xác nhận môn (BẮT BUỘC, không có ngoại lệ; xem quy tắc đầu trang).** Không được tự chọn mã môn thay người dùng, kể cả khi có vẻ hiển nhiên.
   - Với mỗi tên hoặc mã người dùng gõ, tìm trong `index.json` (không phân biệt hoa thường và dấu; `2` = `II`). Tên gọi tắt thường khớp nhiều mã (VD “xác suất thống kê”, “cấu trúc dữ liệu và giải thuật”).
   - In **một bảng**: `bạn gõ → mã môn, tên môn đầy đủ (nguyên văn index.json), tín chỉ`. Khớp nhiều kết quả thì liệt kê **tất cả** ứng viên để người dùng chọn; khớp một kết quả vẫn ghi vào bảng.
   - **Dừng và chờ người dùng xác nhận hoặc sửa bảng.** Chưa xác nhận thì không xếp lịch, không tạo link. Không tìm thấy thì hỏi lại; không tự thay hay bỏ môn. Người dùng đã đưa mã môn có trong `index.json` thì chỉ ghi vào bảng.
2. **Hỏi mong muốn** (chỉ sau khi người dùng đã xác nhận môn; có thể hỏi cùng lúc với bảng môn nhưng không được xếp trước khi có xác nhận) (gộp một lần, không hỏi lại điều đã biết), gồm **cơ sở học** (CS1 / CS2 / cơ sở chính), thứ 7 và chủ nhật, sáng thứ 2, giảng viên, số phương án. Chi tiết: [references/preferences.md](references/preferences.md).
3. **Xếp lịch** theo [references/solving.md](references/solving.md). Ràng buộc cứng luôn thắng ưu tiên mềm: đủ môn, một lớp mỗi môn, không trùng tiết, điều kiện bắt buộc.
4. **Kiểm tra từng phương án** trước khi trả lời: mã môn và lớp tồn tại, đủ một lớp mỗi môn, không cặp nào trùng tiết, đạt điều kiện bắt buộc. Không tuyên bố đạt điều bạn không kiểm tra được. Không có phương án đủ môn thì **không tạo link**: nêu vấn đề và hỏi người dùng nới điều kiện nào; không tự bỏ môn hay tự nới.
5. **Trả kết quả** theo [references/output.md](references/output.md): một link, mã môn đã chọn, tổng tín chỉ, số phương án thực tế, ưu tiên đạt / chưa đạt / không kiểm tra được, và các đánh đổi (VD phương án tốt nhất phải học thứ 7).

## Lưu ý

- Dữ liệu không cho biết còn chỗ đăng ký hay không, và có thể không đúng học kỳ người dùng cần; nói rõ khi liên quan.
- Website kiểm tra lại link khi mở; một phương án sai thì cả link bị từ chối.
