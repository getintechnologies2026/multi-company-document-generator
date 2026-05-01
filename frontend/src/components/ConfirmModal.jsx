import { AlertTriangle } from 'lucide-react';

/**
 * Styled confirmation dialog — replaces native browser confirm().
 *
 * Props:
 *  open         {boolean}   - whether the modal is visible
 *  title        {string}    - modal heading
 *  message      {string}    - body text
 *  onConfirm    {function}  - called when user clicks the confirm button
 *  onCancel     {function}  - called when user clicks Cancel or backdrop
 *  confirmLabel {string}    - text for the confirm button (default: "Delete")
 *  variant      {string}    - "danger" (red) | "warn" (amber) | "info" (blue)
 */
export default function ConfirmModal({
  open,
  title = 'Are you sure?',
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  variant = 'danger',
}) {
  if (!open) return null;

  const variantStyles = {
    danger: { icon: 'bg-red-100',   iconColor: 'text-red-500',   btn: 'bg-red-500 hover:bg-red-600 text-white' },
    warn:   { icon: 'bg-amber-100', iconColor: 'text-amber-500', btn: 'bg-amber-500 hover:bg-amber-600 text-white' },
    info:   { icon: 'bg-blue-100',  iconColor: 'text-blue-500',  btn: 'bg-blue-500 hover:bg-blue-600 text-white' },
  };
  const s = variantStyles[variant] || variantStyles.danger;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl ${s.icon}`}>
            <AlertTriangle size={20} className={s.iconColor} />
          </div>
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        </div>
        {message && (
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${s.btn}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
