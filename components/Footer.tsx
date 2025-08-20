"use client";

import { FaGithub } from "react-icons/fa";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

export default function Footer() {
  return (
    <footer className="w-full bg-[#1a1a2e] text-white">
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        
        {/* Thông tin bản quyền */}
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-bold tracking-wide">TKB App</h3>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} | Quản lý thời khóa biểu thông minh
          </p>
        </div>

        {/* Liên kết */}
        <div className="flex items-center gap-5">
          <a
            href="https://github.com/huynhthanhtien/tkbsgu"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-white/10 transition transform hover:scale-110"
            title="Xem trên GitHub"
          >
            <FaGithub className="w-6 h-6" />
          </a>
          <a
            href="https://github.com/huynhthanhtien/tkbsgu/issues/new?title=Feedback&body=Vui%20l%C3%B2ng%20nh%E1%BA%ADp%20ph%E1%BA%A3n%20h%E1%BB%93i%20c%E1%BB%A7a%20b%E1%BA%A1n%20t%E1%BA%A1i%20%C4%91%C3%A2y..."
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-white/10 transition transform hover:scale-110"
            title="Gửi phản hồi"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
          </a>
        </div>
      </div>
    </footer>
  );
}
