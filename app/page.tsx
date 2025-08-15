// HomePage.tsx
"use client"

import { useState, useEffect } from "react";
import { PlusCircleIcon, CalendarIcon, FolderOpenIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { FaGithub } from "react-icons/fa";

interface SavedSchedule {
  id: string;
  name: string;
  credits: number;
  createdAt: string;
}

export default function HomePage() {
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);

  useEffect(() => {
    const data = localStorage.getItem("savedSchedules");
    if (data) {
      setSavedSchedules(JSON.parse(data));
    } else {
      // Demo dữ liệu
      setSavedSchedules([
        { id: "1", name: "Học kỳ 1 - CNTT", credits: 18, createdAt: new Date().toISOString() },
        { id: "2", name: "Học kỳ 2 - Kinh tế", credits: 20, createdAt: new Date().toISOString() },
        { id: "3", name: "Học kỳ Hè - Tiếng Anh", credits: 6, createdAt: new Date().toISOString() }
      ]);
    }
  }, []);

  const handleCreateNew = () => {
    const name = prompt("Nhập tên thời khóa biểu:");
    if (name && name.trim() !== "") {
      const newSchedule: SavedSchedule = {
        id: Date.now().toString(),
        name: name.trim(),
        credits: 0,
        createdAt: new Date().toISOString(),
      };

      const updatedSchedules = [...savedSchedules, newSchedule];
      setSavedSchedules(updatedSchedules);
      localStorage.setItem("savedSchedules", JSON.stringify(updatedSchedules));

      alert(`Đã tạo thời khóa biểu mới: ${newSchedule.name}`);
      window.location.href = `/create?id=${newSchedule.id}`;
    } else {
      alert("Vui lòng nhập tên hợp lệ!");
    }
  };

  const handleOpenSchedule = (id: string) => {
    window.location.href = `/schedule/${id}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col justify-between px-4 py-10 text-white font-sans animate-fadeIn">
      <div className="flex flex-col items-center">
        {/* Card giới thiệu */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl text-center max-w-2xl mb-10">
          <h1 className="text-4xl font-bold mb-4 flex justify-center items-center gap-3">
            <CalendarIcon className="w-10 h-10" />  
            Xếp Thời Khóa Biểu
          </h1>
          <p className="text-lg text-white/90">
            Quản lý và sắp xếp thời khóa biểu của bạn một cách chuyên nghiệp, nhanh chóng và trực quan.
          </p>
        </div>

        {/* Nút tạo mới */}
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-3 bg-white text-indigo-600 px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300"
        >
          <PlusCircleIcon className="w-6 h-6" />
          Tạo Thời Khóa Biểu Mới
        </button>

        {/* Danh sách TKB */}
        <div className="mt-10 w-full max-w-xl">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FolderOpenIcon className="w-6 h-6" /> Thời Khóa Biểu Đã Lưu
          </h2>
          {savedSchedules.length > 0 ? (
            <ul className="space-y-3">
              {savedSchedules.map((tkb) => (
                <li
                  key={tkb.id}
                  onClick={() => handleOpenSchedule(tkb.id)}
                  className="bg-white/20 backdrop-blur-md rounded-xl p-4 cursor-pointer hover:bg-white/30 transition duration-300 flex justify-between items-center shadow-md"
                >
                  <div>
                    <span className="font-medium">{tkb.name}</span>
                    <span className="block text-sm text-white/70">Số tín chỉ: {tkb.credits}</span>
                  </div>
                  <span className="text-sm text-white/70">
                    {new Date(tkb.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/80 italic">
              Chưa có thời khóa biểu nào được lưu.
            </p>
          )}
        </div>
      </div>

{/* Footer */}
<footer className="mt-14 w-full bg-gradient-to-r from-white/5 via-white/10 to-white/5 backdrop-blur-lg border-t border-white/20 shadow-lg">
  <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
    
    {/* Thông tin bản quyền */}
    <div className="text-center sm:text-left">
      <h3 className="text-lg font-bold tracking-wide">TKB App</h3>
      <p className="text-sm text-white/70">
        © {new Date().getFullYear()} | Quản lý thời khóa biểu thông minh
      </p>
    </div>

    {/* Liên kết */}
    <div className="flex items-center gap-5">
      <a
        href="https://github.com/ten-ban-du-an"
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full border border-white/30 hover:border-white/60 transition transform hover:scale-110 hover:shadow-[0_0_10px_rgba(255,255,255,0.6)]"
        title="Xem trên GitHub"
      >
        <FaGithub className="w-6 h-6" />
      </a>
      <a
        href="/feedback"
        className="p-2 rounded-full border border-white/30 hover:border-white/60 transition transform hover:scale-110 hover:shadow-[0_0_10px_rgba(255,255,255,0.6)]"
        title="Gửi phản hồi"
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
      </a>
    </div>

  </div>
</footer>

    </div>
  );
}
