This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## AI xếp thời khóa biểu (không cần API key)

Nút **AI Xếp Thời Khóa Biểu** ở trang chủ chạy hoàn toàn trên trình duyệt, không cần `OPENAI_API_KEY`:

1. Chọn các môn và ưu tiên (VD: tránh sáng thứ Hai, ít buổi học).
2. Bấm **Sao chép prompt** rồi dán vào chatbot bạn dùng (ChatGPT, Claude, Gemini...). Prompt đã chứa dữ liệu lớp thật từ `public/data.json`.
3. Dán JSON `{"s": [...], "i": [...]}` chatbot trả về vào ô kết quả, bấm **Kiểm tra & tạo link**.
4. Ứng dụng kiểm tra mã tồn tại, mỗi môn một lớp, không trùng tiết; nếu hợp lệ mới tạo link (`?code=...&checksum=...`). Chatbot không tự tạo link được vì nén + CRC32 phải do ứng dụng thực hiện.

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
