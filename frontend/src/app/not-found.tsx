import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl font-black text-gray-200 dark:text-gray-700 mb-2">404</div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Trang không tồn tại
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          href="/dashboard"
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium text-sm"
        >
          Về Dashboard
        </Link>
      </div>
    </div>
  );
}
