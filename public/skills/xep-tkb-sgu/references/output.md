# Kết quả trả cho người dùng

## Link (một định dạng cho mọi chế độ)

`s` là các mã môn; mỗi `p` là một phương án gồm ID lớp, phân cách bằng dấu phẩy:

```text
https://tkbsgu.vercel.app/?s=841404,841407&p=841404-01,841407-01&p=841404-02,841407-01
```

- Tối đa 20 `p`. Mọi `p` phải hợp lệ và đủ đúng một lớp mỗi môn; một `p` sai thì website từ chối cả link.
- Không trộn `p` với `i`, `code` hay `checksum`.
- Chỉ dùng dấu phẩy và gạch ngang, nên chatbot tự viết được; agent dùng thư viện URL chuẩn. Link trong ví dụ chỉ để minh họa định dạng: chỉ tạo link thật từ dữ liệu đã kiểm tra.
- Sau khi tạo, đọc lại link và đối chiếu mã.

## Nội dung trả lời

- **Một link**.
- Mã môn đã chọn, số môn, tổng tín chỉ (mỗi môn cộng một lần), số phương án thực tế.
- Ưu tiên đã đạt / chưa đạt / không kiểm tra được, và các đánh đổi.
- Nếu tìm kiếm bị cắt sớm hoặc không đủ số phương án yêu cầu, nói rõ.
- Hướng dẫn: mở link, đặt tên, bấm **Lưu**, chọn phương án xem thử rồi bấm **Áp dụng**. Lịch lưu trong trình duyệt của người dùng; link không lưu tên hay ghi chú từng phương án.
- Website kiểm tra lại khi mở; nếu dữ liệu lớp đổi sau này, link có thể không còn hợp lệ.
