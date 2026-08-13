import { useEffect, useState } from "react";
import { subscribeLoading } from "../api/client";
export default function GlobalLoader() {
  const [on, setOn] = useState(false);
  useEffect(() => subscribeLoading(setOn), []);
  if (!on) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
      <div className="rounded-2xl bg-white px-8 py-7 shadow-2xl text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <p className="mt-4 font-semibold text-slate-800">Loading...</p>
        <p className="text-xs text-slate-500">Please wait</p>
      </div>
    </div>
  );
}
