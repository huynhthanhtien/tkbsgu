"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}

/** Bảng trượt từ dưới lên: thay cho modal giữa màn hình trên điện thoại (vùng chạm lớn, vuốt/bấm nền để đóng). */
export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-150"
        onClick={onClose}
      />
      <div className="relative w-full max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pt-2">
          <div className="mx-auto h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden />
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <h2 className="text-base font-semibold leading-snug">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-gray-500 active:bg-gray-100 dark:active:bg-gray-800"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
        <div className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}
