// HomePage.tsx
"use client"

import { useState, useEffect } from "react";
import { PlusCircleIcon, CalendarIcon, FolderOpenIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
// import { FaGithub } from "react-icons/fa";
import { useIndexedDB } from "@/context/IndexedDBContext";
import { Tkb, Subject, ScheduleItem } from "@/components/types";
import { useRouter, useSearchParams } from "next/navigation";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Compressor, TkbsDecode } from "@/utils/compressor";
import { toast } from "sonner";
import Footer from "@/components/Footer";

// import { getSubjectById } from "@/components/ui/search"
// interface SavedSchedule {
//   id: string;
//   name: string;
//   credits: number;
//   createdAt: string;
// }


const getTotalCredits = (schedule: { [key: string]: ScheduleItem }): number => {
  const scheduledSubjectIds = Array.from(new Set(Object.values(schedule).map(item => item.subjectId)));
  // console.log(scheduledSubjectIds)
  // console.log(schedule)
  // Lấy các credit duy nhất từ schedule
  const credits = new Set();
  let total = 0;
  for (const subjectId of scheduledSubjectIds) {
    // Tìm 1 block bất kỳ của subjectId này trong schedule
    const block = Object.values(schedule).find(item => item.subjectId === subjectId && typeof item.credit === 'number');
    if (block && !credits.has(subjectId)) {
      total += block.credit;
      credits.add(subjectId);
    }
  }
  return total;
};



export default function HomePage() {

  const { getTkbList, addTkb, ready, removeTkb } = useIndexedDB();
  const [savedSchedules, setSavedSchedules] = useState<Tkb[]>([]);
  const [shareSchedules, setShareSchedules] = useState<Tkb>();
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [name, setName] = useState("");
  const [shareName, setShareName] = useState("");
  // import popup
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const checksum = searchParams.get("checksum");

    if ((!code) && (!checksum)) return;

    try {
      if ((!code) || (!checksum) || (!Compressor.verifyUrl(code, checksum))) {
        throw ""
      }
      const obj = Compressor.decode<{
        s: string[],
        i: string[],
      }>(code);
      const newData: Tkb = {
        createdAt: new Date().toISOString(),
        id: Date.now(),
        name: "",
        data: TkbsDecode(obj.s, obj.i)
      }
      setShareSchedules(newData);
      setOpen(true);
    } catch {
      toast.error("URL không hợp lệ");
    } finally {
      router.replace("/");
    }

  }, [searchParams]);

  const handleSubmitShare = async () => {
    if (shareName.trim() && shareSchedules) {
      const newTkb: Tkb = {
        id: shareSchedules.id,
        name: shareName,
        createdAt: shareSchedules.createdAt,
        data: shareSchedules.data,
      }
      await addTkb(newTkb);
      toast.success("Đã nhập thời khoá biểu xong!");
      setOpen(false);
    }
    setShareName("");
    router.replace("/");
    fetchData();
  }

  const fetchData = async () => {
    const list = await getTkbList();
    // console.log("list", list);
    setSavedSchedules(list);
  };

  const handleSubmit = async () => {
    if (name.trim()) {
      // console.log("Tên TKB:", name);
      const newTkb: Tkb = {
        id: Date.now(),
        name: name,
        createdAt: new Date().toISOString(),
        data: {
          Sub: [],
          ScheduleItem: {}
        }
      }
      await addTkb(newTkb);
      setShowPopup(false);
    }
    fetchData();
  };

  useEffect(() => {
    if (!ready) return;
    fetchData();
  }, [ready]);

  const handleCreateNew = () => {
    setShowPopup(true);
  };

  const handleOpenSchedule = (tkb: Tkb) => {
    // window.location.href = `/schedule/${id}`;
    // setSelectedTkb(tkb);
    router.push(`/tkb/${tkb.id}`);
  };

  const handleDelete = async (tkb: Tkb) => {
    await removeTkb(tkb.id);
    toast.success(`Đã xoá thời khoá biểu '${tkb.name}' khỏi danh sách!`);
    fetchData();
  }

  const handleEdit = (tkb: Tkb) => {

  }

  const handleShare = (tkb: Tkb) => {
    const listId: string[] = [];
    tkb.data.Sub.forEach(val => {
      listId.push(val.id);
    });
    const scheduleItem = tkb.data.ScheduleItem;

    // Lấy danh sách [{ dayKey, subjectId }]
    const result = Object.entries(scheduleItem).map(([dayKey, item]) => ({
      // day: dayKey,
      subjectId: item.classId,
    }));

    const uniqueIds = Array.from(new Set(result.map(item => item.subjectId)));

    const newData = {
      "s": listId,
      "i": uniqueIds,
    }

    // console.log("share: ", newData);

    TkbsDecode(listId, uniqueIds);
    // console.log("real data", tkb.data);
    console.log("data tkb: ", Compressor.encode(newData));
    if (Compressor.copyCurrentUrlWithChecksum(Compressor.encode(newData))) {
      toast.success('Đã sao chép url thời khóa biểu vào clipboard!');
    }

    // console.log("decode: ",Compressor.decode(Compressor.encode(newData)));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col justify-between text-white font-sans animate-fadeIn">
      <div className="flex flex-col items-center py-10">
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
              {savedSchedules.slice().reverse().map((tkb) => (

                <li
                  key={tkb.id}
                  onClick={() => handleOpenSchedule(tkb)}
                  className="bg-white/20 backdrop-blur-md rounded-xl p-4 cursor-pointer hover:bg-white/30 transition duration-300 flex justify-between items-center shadow-md"
                >
                  <div>
                    <span className="font-medium">{tkb.name}</span>
                    <span className="block text-sm text-white/70">
                      Số tín chỉ: {getTotalCredits(tkb.data.ScheduleItem)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/70">
                      {new Date(tkb.createdAt).toLocaleDateString()}
                    </span>

                    {/* Menu dấu 3 chấm */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="p-2 rounded-full hover:bg-white/20 transition"
                          onClick={(e) => e.stopPropagation()} // Ngăn việc click mở tkb
                        >
                          <MoreVertical className="w-5 h-5 text-white/80" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-40 bg-white/90 backdrop-blur-md rounded-lg shadow-md">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(tkb);
                          }}
                        >
                          Chia sẻ
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(tkb);
                          }}
                        >
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(tkb);
                          }}
                          className="text-red-500"
                        >
                          Xoá
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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

      <Footer />


      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[1px] z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-96">
            <h2 className="text-xl font-semibold text-black mb-4 text-center">
              Nhập tên thời khóa biểu
            </h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
              placeholder="Ví dụ: Học kỳ 1 - 2025"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-black hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[1px] z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-96">
            <h2 className="text-xl font-semibold text-black mb-4 text-center">
              Nhập tên thời khóa biểu
            </h2>
            <input
              type="text"
              value={shareName}
              onChange={(e) => setShareName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
              placeholder="Ví dụ: Học kỳ 1 - 2025"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-black hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitShare}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
