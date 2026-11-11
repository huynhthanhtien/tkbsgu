---
name: xep-tkb-sgu
description: Xếp thời khóa biểu SGU từ môn học và mong muốn của người dùng, kiểm tra các phương án và tạo link chia sẻ. Dùng khi người dùng muốn xếp thời khóa biểu SGU.
---

# Hướng dẫn AI agent xếp thời khóa biểu SGU

Tài liệu này hướng dẫn agent xếp lịch theo yêu cầu của người dùng và tạo **một link chứa nhiều phương án**. Đây là hướng dẫn đọc qua URL; không cần cài MCP, skill hay API key của website.

## Dữ liệu và website

- Tạo link kết quả cho website: `https://tkbsgu.vercel.app`.
- Lấy dữ liệu môn từ GitHub: <https://raw.githubusercontent.com/huynhthanhtien/tkbsgu/main/public/data.json>. Nếu không truy cập được dữ liệu, thông báo cho người dùng và không tự bịa kết quả.
- Có thể tham khảo <https://raw.githubusercontent.com/huynhthanhtien/tkbsgu/main/public/tkb.json> để tìm thông tin học kỳ, nhưng không mặc định file đó luôn phản ánh chính xác `data.json`; nếu không xác định được, nói rõ. Dữ liệu không xác nhận số chỗ đăng ký còn trống.
- Cần khả năng đọc dữ liệu và tính toán, ưu tiên chạy code để kiểm tra. Nếu không thể thực hiện hoặc kiểm tra kết quả, nói rõ giới hạn; không tự bịa mã môn, lớp hoặc link.

`data.json` là mảng môn học: `ma_mon`, `ten_mon`, `so_tc`, `lop`. Mỗi lớp có `nhom_to` và `tkb`; mỗi buổi có `thu`, `tbd`, `tkt`, `phong`, `giang_vien` và có thể có `ngay`. ID lớp có dạng `ma_mon-nhom_to`, ví dụ `841404-01`.

## Trao đổi với người dùng

Trước khi xếp, đọc thông tin người dùng đã cung cấp và hỏi gộp những điều cần làm rõ. Không hỏi lại điều đã biết.

- Nếu chưa có danh sách môn, hỏi tên hoặc mã môn. Tìm theo tên hoặc mã, không phân biệt hoa thường và nên bỏ dấu. Nếu tên mơ hồ hoặc có nhiều kết quả, đưa các lựa chọn kèm mã môn để người dùng chọn. Nếu không tìm thấy, hỏi lại; không tự thay hoặc bỏ môn.
- Nếu người dùng chưa mô tả mong muốn, hỏi một câu mở: **“Bạn muốn thời khóa biểu như thế nào? Có điều gì cần lưu ý về ngày, giờ, giảng viên, cơ sở hoặc cách sắp xếp lịch không?”** Người dùng có thể trả lời tự do hoặc nói không có yêu cầu khác.
- Phân biệt điều kiện bắt buộc và ưu tiên mềm. Nếu một yêu cầu mơ hồ có thể ảnh hưởng đến kết quả, hỏi lại. Nếu không rõ dữ liệu có đúng học kỳ người dùng cần, giải thích thông tin biết được và hỏi trước khi tiếp tục.
- Mặc định tạo 5 phương án nếu người dùng không chỉ định; tối đa 20. Nếu yêu cầu nhiều hơn, giải thích và hỏi có muốn lấy tối đa 20 không.

## Xếp và kiểm tra

1. Tìm các lớp từ dữ liệu thật; mỗi phương án chọn đúng một lớp cho mỗi môn. Các phương án phải khác nhau ít nhất một lớp.
2. Kiểm tra tất cả buổi của từng lớp. Website coi hai buổi xung đột khi `thu` giống nhau và `max(tbd1, tbd2) <= min(tkt1, tkt2)`. Quy tắc này bỏ qua khoảng ngày `ngay`, kể cả khi hai lớp học khác tuần.
3. Tránh lớp không có lịch, tiết không hợp lệ hoặc thiếu thông tin cần cho điều kiện của người dùng. Không tuyên bố đã đáp ứng điều không kiểm tra được.
4. Áp dụng điều kiện bắt buộc trước, sau đó xếp hạng theo ưu tiên mềm. Có thể dùng quay lui và tập `(thu, tiet)`; giới hạn thời gian hoặc số tổ hợp nếu cần, và thông báo nếu dừng sớm. Không khẳng định kết quả tối ưu tuyệt đối nếu chưa kiểm tra đầy đủ.
5. Kiểm tra lại từng phương án: mã môn và lớp tồn tại, đủ đúng một lớp mỗi môn, không trùng tiết và đáp ứng các điều kiện bắt buộc. Nếu không tìm đủ số phương án, báo số lượng thực tế; không tạo link khi không có phương án đủ môn.
6. Nếu không thể xếp đủ môn theo điều kiện bắt buộc, trình bày vấn đề và hỏi người dùng muốn nới điều kiện nào. Không tự bỏ môn hoặc nới điều kiện.

## Tạo link và trả kết quả

Link có một tham số `s` chứa các mã môn và một tham số `p` cho mỗi phương án. Mỗi `p` chứa ID lớp, phân cách bằng dấu phẩy:

```text
https://tkbsgu.vercel.app/?s=841404,841407&p=841404-01,841407-01&p=841404-02,841407-01
```

Đây chỉ là ví dụ định dạng. Trước khi tạo link thực tế, phải kiểm tra lại mã và lịch bằng dữ liệu hiện tại. Dùng thư viện URL chuẩn để mã hóa; giữ nguyên nhiều tham số `p`. Không trộn `p` với `i`, `code` hoặc `checksum`. Tối đa 20 phương án; nếu một phương án không hợp lệ, website từ chối toàn bộ link.

Sau khi tạo, đọc lại URL và kiểm tra các mã và phương án. Trả **một link**, số môn, tổng tín chỉ, số phương án và những ưu tiên đã đáp ứng hoặc chưa thể xác nhận. Tổng tín chỉ chỉ cộng một lần cho mỗi môn. Giải thích người dùng mở link, đặt tên và bấm **Lưu**, sau đó chọn phương án xem thử và bấm **Áp dụng** nếu muốn. Website lưu lịch trong trình duyệt của người dùng; link không lưu tên hoặc ghi chú riêng cho từng phương án.

Website kiểm tra lại dữ liệu khi mở link. Nếu dữ liệu lớp thay đổi sau này, link có thể không còn hợp lệ hoặc lịch hiển thị có thể thay đổi.
