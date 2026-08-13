export default function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-2xl",
  footer,
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className={`w-full ${width} max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="h-9 w-9 cursor-pointer rounded-lg hover:bg-slate-100"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="border-t bg-slate-50 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
