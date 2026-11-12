import data from "@/public/seat-data.json";

type Capacity = { sl_dk?: number | null; sl_cp?: number | null; sl_cl?: number | null; to?: string | null; ds_lop?: string[] | null };
type Entry = Capacity & { thong_tin_so_luong?: Capacity[] };
const classes: Record<string, Entry> = data.lop;

export default function ClassCapacity({ id }: { id: string }) {
  const entry = classes[id];
  if (!entry) return <div className="mt-1 text-xs opacity-75">Chưa có thông tin sĩ số</div>;
  const options = entry.thong_tin_so_luong ?? [entry];
  return <div className="mt-2 space-y-1" title={`Số liệu tham khảo · ${data.hoc_ky_dang_ky}`}>
    {options.map((option, index) => {
      const known = typeof option.sl_dk === "number" && typeof option.sl_cp === "number" && typeof option.sl_cl === "number";
      return <div key={index} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {options.length > 1 && <span>{option.to ? `Tổ ${option.to}` : `Lớp ${index + 1}`}{option.ds_lop?.length ? ` · ${option.ds_lop.join(", ")}` : ""}:</span>}
        {known ? <><span className="font-semibold">{option.sl_dk}/{option.sl_cp} đã đăng ký</span><span className={`rounded-full px-2 py-0.5 font-semibold ${option.sl_cl === 0 ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}>{option.sl_cl === 0 ? "Hết chỗ" : `Còn ${option.sl_cl} chỗ`}</span></> : <span>Chưa có thông tin sĩ số</span>}
      </div>;
    })}
  </div>;
}
