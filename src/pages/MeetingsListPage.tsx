import React, { useState, useEffect, useCallback } from 'react';
import { listMeetings, deleteMeeting } from '../api/meetings';
import { MeetingListItem } from '../types/meeting';
import { MeetingCard } from '../components/MeetingCard';
import { useAuth } from '../context/AuthContext';

export const MeetingsListPage: React.FC = () => {
  const { openTokenModal } = useAuth();
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<'start_time_desc' | 'start_time_asc' | 'created_at_desc' | 'created_at_asc'>('start_time_desc');
  const [roleTab, setRoleTab] = useState<'all' | 'owner' | 'participant'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deletion state
  const [meetingToDelete, setMeetingToDelete] = useState<MeetingListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listMeetings({
        page,
        page_size: pageSize,
        sort,
        search: debouncedSearch || undefined,
      });
      setMeetings(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch meetings:', err);
      setError(err.message || 'Không thể tải danh sách cuộc họp.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sort, debouncedSearch]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleConfirmDelete = async () => {
    if (!meetingToDelete) return;
    try {
      setIsDeleting(true);
      const isParticipant = meetingToDelete.user_role === 'PARTICIPANT';
      await deleteMeeting(meetingToDelete.id);
      setMeetings((prev) => prev.filter((m) => m.id !== meetingToDelete.id));
      setTotal((prev) => Math.max(0, prev - 1));
      setDeleteMessage({
        type: 'success',
        text: isParticipant
          ? `Đã ẩn cuộc họp "${meetingToDelete.title || meetingToDelete.meeting_code || meetingToDelete.id.substring(0, 8)}" khỏi danh sách của bạn.`
          : `Đã xóa cuộc họp "${meetingToDelete.title || meetingToDelete.meeting_code || meetingToDelete.id.substring(0, 8)}" thành công.`,
      });
      setMeetingToDelete(null);
    } catch (err: any) {
      console.error('Delete meeting error:', err);
      setDeleteMessage({
        type: 'error',
        text: err.message || 'Không thể xóa cuộc họp.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMeetings = meetings.filter((m: MeetingListItem) => {
    if (roleTab === 'owner') return m.user_role === 'OWNER';
    if (roleTab === 'participant') return m.user_role === 'PARTICIPANT';
    return true;
  });

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh sách cuộc họp</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý, xem lại biên bản hội thoại, chạy AI phân tích và trích xuất dữ liệu.
          </p>
        </div>

        <button
          onClick={fetchMeetings}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto disabled:opacity-60"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          <span>Làm mới</span>
        </button>
      </div>

      {/* Delete / Action Message Banner */}
      {deleteMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between animate-in fade-in duration-200 border ${
            deleteMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{deleteMessage.type === 'success' ? '✅' : '❌'}</span>
            <span>{deleteMessage.text}</span>
          </div>
          <button
            onClick={() => setDeleteMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-3"
            title="Đóng"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, mã cuộc họp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
          />
          <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 whitespace-nowrap">Sắp xếp:</span>
          <select
            value={sort}
            onChange={(e: any) => setSort(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium cursor-pointer"
          >
            <option value="start_time_desc">Mới nhất (Bắt đầu)</option>
            <option value="start_time_asc">Cũ nhất (Bắt đầu)</option>
            <option value="created_at_desc">Mới tạo gần nhất</option>
            <option value="created_at_asc">Tạo đầu tiên</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          {error.includes('401') && (
            <button
              onClick={openTokenModal}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
            >
              Thiết lập Token
            </button>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && meetings.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* Role Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setRoleTab('all')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            roleTab === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Tất cả ({meetings.length})
        </button>
        <button
          type="button"
          onClick={() => setRoleTab('owner')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            roleTab === 'owner'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          📝 Tôi chủ trì ({meetings.filter((m) => m.user_role === 'OWNER').length})
        </button>
        <button
          type="button"
          onClick={() => setRoleTab('participant')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            roleTab === 'participant'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          👥 Tôi tham gia ({meetings.filter((m) => m.user_role === 'PARTICIPANT').length})
        </button>
      </div>

      {/* Empty State */}
      {!loading && filteredMeetings.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 space-y-3">
          <div className="text-4xl">🎙️</div>
          <h3 className="text-base font-semibold text-slate-800">
            {meetings.length === 0 ? 'Không có cuộc họp nào' : 'Không có cuộc họp nào trong tab này'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {debouncedSearch
              ? `Không tìm thấy kết quả phù hợp với từ khóa "${debouncedSearch}".`
              : meetings.length === 0
              ? 'Hãy mở Google Meet với Chrome Extension để tự động ghi lại cuộc họp.'
              : 'Chuyển sang tab khác hoặc kiểm tra lại các bộ lọc.'}
          </p>
        </div>
      )}

      {/* Meeting Cards List */}
      {filteredMeetings.length > 0 && (
        <div className="space-y-3">
          {filteredMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onDelete={(m) => setMeetingToDelete(m)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-600">
          <div>
            Hiển thị trang <span className="font-semibold text-slate-900">{page}</span> / <span className="font-semibold text-slate-900">{totalPages}</span> (Tổng {total} cuộc họp)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-medium transition-colors"
            >
              Trang trước
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-medium transition-colors"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}

      {/* Delete / Hide Confirmation Modal */}
      {meetingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className={`flex items-center space-x-3 ${meetingToDelete.user_role === 'PARTICIPANT' ? 'text-blue-600' : 'text-rose-600'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${meetingToDelete.user_role === 'PARTICIPANT' ? 'bg-blue-50' : 'bg-rose-50'}`}>
                {meetingToDelete.user_role === 'PARTICIPANT' ? '👁️' : '⚠️'}
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {meetingToDelete.user_role === 'PARTICIPANT' ? 'Ẩn cuộc họp khỏi danh sách' : 'Xác nhận xóa cuộc họp'}
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {meetingToDelete.user_role === 'PARTICIPANT' ? (
                <>
                  Bạn có chắc chắn muốn ẩn cuộc họp{' '}
                  <span className="font-semibold text-slate-900">
                    "{meetingToDelete.title || meetingToDelete.meeting_code || meetingToDelete.id.substring(0, 8)}"
                  </span>{' '}
                  khỏi danh sách cá nhân?
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn xóa cuộc họp{' '}
                  <span className="font-semibold text-slate-900">
                    "{meetingToDelete.title || meetingToDelete.meeting_code || meetingToDelete.id.substring(0, 8)}"
                  </span>
                  ?
                </>
              )}
            </p>

            {meetingToDelete.user_role === 'PARTICIPANT' ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
                <p className="font-semibold">Thông tin thêm:</p>
                <p className="text-blue-700">
                  Dữ liệu cuộc họp và phụ đề của chủ phòng sẽ không bị xóa. Cuộc họp này chỉ không còn hiển thị trong danh sách của bạn.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <p className="font-semibold">Lưu ý quan trọng:</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                  <li>Toàn bộ biên bản hội thoại (transcript) sẽ bị xóa vĩnh viễn.</li>
                  <li>Kết quả phân tích AI và Action Items liên quan sẽ bị xóa.</li>
                  <li>Hành động này <strong>không thể khôi phục</strong>.</li>
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setMeetingToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={`inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer ${
                  meetingToDelete.user_role === 'PARTICIPANT'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>{meetingToDelete.user_role === 'PARTICIPANT' ? '👁️' : '🗑️'}</span>
                    <span>{meetingToDelete.user_role === 'PARTICIPANT' ? 'Ẩn khỏi danh sách' : 'Xác nhận xóa'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
