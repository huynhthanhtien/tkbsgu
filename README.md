This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## AI xếp thời khóa biểu (không cần API key)

Trong trang thời khóa biểu, nút **Prompt AI** tạo prompt để sử dụng với chatbot, không cần `OPENAI_API_KEY`:

1. Chọn các môn và ưu tiên (VD: tránh sáng thứ Hai, ít buổi học).
2. Bấm **Sao chép prompt** rồi dán vào chatbot bạn dùng (ChatGPT, Claude, Gemini...). Prompt đã chứa dữ liệu lớp thật từ `public/data.json`.
3. Dán câu trả lời của chatbot vào ô kết quả và bấm **Kiểm tra và xem thử trên thời khóa biểu**.
4. Ứng dụng kiểm tra mã lớp, số môn và xung đột trước khi cho xem thử và áp dụng từng phương án.

Để dùng một agent bên ngoài, bấm **Copy prompt cho agent** trên trang chủ và dán vào cuộc trò chuyện. Skill `public/skills/xep-tkb-sgu/SKILL.md` dùng chung cho agent và chatbot, tự chọn chế độ theo khả năng:

- **Agent có tải URL và chạy code**: dùng `scripts/tkb.py` (chỉ cần Python 3) để tìm môn, xem lớp, xếp và kiểm tra phương án, rồi in link.
- **Agent chỉ tải được URL**: tải từng môn và tự xếp, tự kiểm tra từng cặp lớp.
- **Chatbot thuần chat**: dùng nút **Prompt AI** (prompt đã chứa dữ liệu). Ô kết quả nhận cả JSON `{"plans": [...]}` lẫn link `?s=...&p=...`.

Dữ liệu và skill được lấy từ GitHub raw trước (`raw.githubusercontent.com/huynhthanhtien/tkbsgu/main/public/...`), Vercel là dự phòng, vì Vercel đôi khi bị agent hoặc sandbox chặn.

## Cập nhật dữ liệu cho agent

Sau khi lưu phản hồi API vào `test/w-locdsnhomto.json`, tạo lại dữ liệu web và dữ liệu agent:

```bash
python3 scripts/import_registration_data.py
python3 scripts/split_subjects.py
```

`public/data.json` chứa học kỳ và danh sách môn trong trường `mon_hoc`. Script chia môn tạo danh mục gọn, cập nhật các file môn trong `public/agent-data/` và xóa các file môn không còn trong danh mục. Đưa các file được tạo lên GitHub cùng `data.json` để Vercel phục vụ chúng. Có thể chỉ định đường dẫn khác bằng `--input` và `--output`.

## Chia sẻ nhiều phương án qua URL

Sau khi có phương án hợp lệ trong trang thời khóa biểu, bấm **Chia sẻ phương án** để sao chép một link. Người nhận mở link, đặt tên và lưu; các phương án được kiểm tra lại và xuất hiện trong thanh phương án để xem thử và áp dụng. Lịch chính ban đầu để trống. Tên và ghi chú AI không được đưa vào link; các phương án được đặt tên theo thứ tự. Phương án không hợp lệ không được chia sẻ.

Agent cũng có thể tạo link trực tiếp bằng mã môn và mã lớp, tối đa 20 phương án:

```text
https://tkbsgu.vercel.app/?s=841404,841407&p=841404-01,841407-01&p=841404-02,841407-01
```

`s` là danh sách mã môn, mỗi tham số `p` là một phương án gồm đúng một mã lớp cho mỗi môn. Mọi phương án phải hợp lệ và không trùng tiết; chỉ cần một phương án không hợp lệ thì link bị từ chối. Các định dạng link chia sẻ cũ vẫn được hỗ trợ.

Với nhóm có nhiều tổ, mã lớp gồm cả mã tổ, ví dụ `806414-01-02` là môn 806414, nhóm 01, tổ 02. Nếu lịch cũ chỉ ghi nhóm mà không xác định được tổ, lịch đã lưu được giữ lại để người dùng kiểm tra và chọn lại tổ.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
