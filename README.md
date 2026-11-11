This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## AI xếp thời khóa biểu (không cần API key)

Trong trang thời khóa biểu, nút **Prompt AI** tạo prompt để sử dụng với chatbot, không cần `OPENAI_API_KEY`:

1. Chọn các môn và ưu tiên (VD: tránh sáng thứ Hai, ít buổi học).
2. Bấm **Sao chép prompt** rồi dán vào chatbot bạn dùng (ChatGPT, Claude, Gemini...). Prompt đã chứa dữ liệu lớp thật từ `public/data.json`.
3. Dán câu trả lời của chatbot vào ô kết quả và bấm **Kiểm tra và xem thử trên thời khóa biểu**.
4. Ứng dụng kiểm tra mã lớp, số môn và xung đột trước khi cho xem thử và áp dụng từng phương án.

Để dùng một agent bên ngoài, bấm **Copy prompt cho agent** trên trang chủ và dán vào cuộc trò chuyện. Agent đọc `/skills/xep-tkb-sgu/SKILL.md`, tra danh mục `/agent-data/index.json` rồi tải từng môn cần dùng từ `/agent-data/subjects/<ma_mon>.json`. Agent cần quyền truy cập dữ liệu và khả năng tính toán.

## Cập nhật dữ liệu cho agent

Sau khi cập nhật `public/data.json`, chạy:

```bash
python3 scripts/split_subjects.py
```

Script tạo danh mục gọn và các file môn trong `public/agent-data/`, không sửa file gốc. Đưa các file được tạo lên GitHub cùng `data.json` để Vercel phục vụ chúng. Script không xóa file môn cũ; chỉ các mã có trong `index.json` thuộc danh mục hiện tại. Có thể chỉ định đường dẫn khác bằng `--input` và `--output`.

## Chia sẻ nhiều phương án qua URL

Sau khi có phương án hợp lệ trong trang thời khóa biểu, bấm **Chia sẻ phương án** để sao chép một link. Người nhận mở link, đặt tên và lưu; các phương án được kiểm tra lại và xuất hiện trong thanh phương án để xem thử và áp dụng. Lịch chính ban đầu để trống. Tên và ghi chú AI không được đưa vào link; các phương án được đặt tên theo thứ tự. Phương án không hợp lệ không được chia sẻ.

Agent cũng có thể tạo link trực tiếp bằng mã môn và mã lớp, tối đa 20 phương án:

```text
https://tkbsgu.vercel.app/?s=841404,841407&p=841404-01,841407-01&p=841404-02,841407-01
```

`s` là danh sách mã môn, mỗi tham số `p` là một phương án gồm đúng một mã lớp cho mỗi môn. Mọi phương án phải hợp lệ và không trùng tiết; chỉ cần một phương án không hợp lệ thì link bị từ chối. Các định dạng link chia sẻ cũ vẫn được hỗ trợ.

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
