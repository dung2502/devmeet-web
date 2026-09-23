import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMeeting, deleteMeeting, updateMeetingTitle } from '../api/meetings';
import { getTranscriptView } from '../api/transcript';
import { processMeetingAI } from '../api/ai';
import { MeetingDetail } from '../types/meeting';
import { TranscriptViewResponse } from '../types/transcript';
import { StatusBadge } from '../components/StatusBadge';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { SummaryOverview } from '../components/SummaryOverview';
import { ActionItemsTable } from '../components/ActionItemsTable';
import { DecisionsTable } from '../components/DecisionsTable';
import { FollowUpEmail } from '../components/FollowUpEmail';
import { GoogleSheetsView } from '../components/GoogleSheetsView';
import { ExportDropdown } from '../components/ExportDropdown';

type TabType = 'transcript' | 'summary' | 'actions_decisions' | 'email' | 'sheets';

export const MeetingDetailPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [transcriptView, setTranscriptView] = useState<TranscriptViewResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('transcript');

  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [loadingTranscript, setLoadingTranscript] = useState(true);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Deep-linking timestamp state
  const [targetTimestamp, setTargetTimestamp] = useState<string | null>(null);

  // Inline title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // More actions dropdown state
  const [showMoreActions, setShowMoreActions] = useState(false);
  const moreActionsRef = useRef<HTMLDivElement>(null);

  const participantNames = React.useMemo(() => {
    const names = new Set<string>();
    if (meeting?.participants && meeting.participants.length > 0) {
      meeting.participants.forEach((p) => {
        const name = p.display_name || p.email;
        if (name && name.trim()) {
          names.add(name.trim());
        }
      });
    }
    if (transcriptView?.entries && transcriptView.entries.length > 0) {
      transcriptView.entries.forEach((e) => {
        if (e.speaker && e.speaker.trim() && e.speaker.toLowerCase() !== 'unknown') {
          names.add(e.speaker.trim());
        }
      });
    }
    return Array.from(names);
  }, [meeting?.participants, transcriptView?.entries]);

  const participantCount = Math.max(meeting?.participants?.length || 0, participantNames.length);

  const loadData = useCallback(async () => {
    if (!meetingId) return;

    // Load meeting details
    try {
      setLoadingMeeting(true);
      const m = await getMeeting(meetingId);
      setMeeting(m);
      // Default to summary tab if AI is already completed
      if (m.ai_status === 'COMPLETED' && m.ai_result) {
        setActiveTab('summary');
      }
    } catch (err: any) {
      console.error('Failed to load meeting:', err);
      setActionMessage({ type: 'error', text: err.message || 'Không thể tải thông tin cuộc họp' });
    } finally {
      setLoadingMeeting(false);
    }

    // Load transcript view
    try {
      setLoadingTranscript(true);
      const t = await getTranscriptView(meetingId);
      setTranscriptView(t);
    } catch (err: any) {
      console.error('Failed to load transcript view:', err);
    } finally {
      setLoadingTranscript(false);
    }
  }, [meetingId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Click-outside listener for More Actions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(event.target as Node)) {
        setShowMoreActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveTitle = async () => {
    if (!meetingId || !meeting) return;
    const cleanTitle = editedTitle.trim();
    if (!cleanTitle) return;
    try {
      setIsSavingTitle(true);
      const updated = await updateMeetingTitle(meetingId, cleanTitle);
      setMeeting((prev) => (prev ? { ...prev, title: updated.title || cleanTitle } : prev));
      setIsEditingTitle(false);
      setActionMessage({ type: 'success', text: 'Đã đổi tên cuộc họp thành công.' });
    } catch (err: any) {
      console.error('Failed to update title:', err);
      setActionMessage({ type: 'error', text: err.message || 'Không thể đổi tên cuộc họp' });
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleJumpToTranscript = (timestamp: string) => {
    setActiveTab('transcript');
    setTargetTimestamp(timestamp);
  };

  const handleRunAI = async (forceReprocess: boolean = false) => {
    if (!meetingId) return;
    try {
      setIsProcessingAI(true);
      setActionMessage({
        type: 'info',
        text: forceReprocess
          ? 'Đang gửi yêu cầu xử lý lại AI tới Gemini 3.6 Flash qua n8n...'
          : 'Đang gửi yêu cầu phân tích AI tới Gemini 3.6 Flash...',
      });

      const response = await processMeetingAI(meetingId, {
        force_reprocess: forceReprocess,
      });

      setActionMessage({
        type: 'success',
        text: `Xử lý AI hoàn tất thành công! (Trạng thái: ${response.ai_status})`,
      });

      // Reload meeting detail to get latest state
      const updatedMeeting = await getMeeting(meetingId);
      setMeeting(updatedMeeting);
      setActiveTab('summary');
    } catch (err: any) {
      console.error('AI processing error:', err);
      setActionMessage({
        type: 'error',
        text: err.message || 'Lỗi trong quá trình chạy AI phân tích.',
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!meetingId) return;
    try {
      setIsDeleting(true);
      await deleteMeeting(meetingId);
      navigate('/meetings');
    } catch (err: any) {
      console.error('Delete meeting failed:', err);
      setActionMessage({
        type: 'error',
        text: err.message || 'Không thể xóa cuộc họp.',
      });
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loadingMeeting && !meeting) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-sm font-medium">Đang tải chi tiết cuộc họp...</p>
      </div>
    );
  }

  if (!meeting && !loadingMeeting) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-3">
        <div className="text-4xl">🔍</div>
        <h2 className="text-lg font-bold text-slate-800">Không tìm thấy cuộc họp</h2>
        <p className="text-xs text-slate-500">Cuộc họp không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Link
          to="/meetings"
          className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const aiOutput = meeting?.ai_result?.ai_output || (meeting?.ai_result as any)?.ai_output || meeting?.ai_result;
  const observability = meeting?.ai_result?.observability || (meeting?.ai_result as any)?.observability;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center space-x-2 text-xs text-slate-500">
        <Link to="/meetings" className="hover:text-indigo-600 font-medium flex items-center space-x-1">
          <span>←</span>
          <span>Danh sách cuộc họp</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate max-w-xs">{meeting?.title || meeting?.id}</span>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center space-x-3 flex-wrap gap-y-1">
              {isEditingTitle ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                    disabled={isSavingTitle}
                    autoFocus
                    className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight bg-white border border-indigo-400 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-sm sm:max-w-md"
                  />
                  <button
                    onClick={handleSaveTitle}
                    disabled={isSavingTitle}
                    className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    title="Lưu tên mới"
                  >
                    {isSavingTitle ? '⏳' : '✓'}
                  </button>
                  <button
                    onClick={() => setIsEditingTitle(false)}
                    disabled={isSavingTitle}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 rounded-lg"
                    title="Hủy"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1
                    className={`text-xl sm:text-2xl font-bold text-slate-900 tracking-tight ${
                      meeting?.user_role === 'OWNER' ? 'cursor-pointer hover:text-indigo-900' : ''
                    }`}
                    onDoubleClick={() => {
                      if (meeting?.user_role === 'OWNER') {
                        setEditedTitle(meeting?.title || '');
                        setIsEditingTitle(true);
                      }
                    }}
                    title={meeting?.user_role === 'OWNER' ? 'Nháy đúp hoặc bấm bút chì để đổi tên' : undefined}
                  >
                    {meeting?.title || `Cuộc họp ${meeting?.meeting_code || meeting?.id.substring(0, 8)}`}
                  </h1>
                  {meeting?.user_role === 'OWNER' && (
                    <button
                      onClick={() => {
                        setEditedTitle(meeting?.title || '');
                        setIsEditingTitle(true);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Đổi tên cuộc họp"
                      aria-label="Đổi tên cuộc họp"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              )}
              {meeting?.meeting_code && !(meeting?.title && meeting.title.includes(meeting.meeting_code)) && (
                <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-semibold">
                  {meeting.meeting_code}
                </span>
              )}
            </div>

            {/* Badges row */}
            <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
              {meeting?.user_role === 'OWNER' ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span>📝</span>
                  <span>Tôi chủ trì</span>
                </span>
              ) : (
                <span
                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                  title={meeting?.host_name ? `Chủ phòng: ${meeting.host_name}` : 'Cuộc họp tham gia'}
                >
                  <span>👥</span>
                  <span>Tôi tham gia{meeting?.host_name ? ` (${meeting.host_name})` : ''}</span>
                </span>
              )}
              <StatusBadge type="status" value={meeting?.status} />
              <StatusBadge type="ai" value={meeting?.ai_status} compact />
              {meeting?.sheets_sync_status && (
                <StatusBadge type="sheets" value={meeting?.sheets_sync_status} compact />
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {meeting?.ai_status !== 'COMPLETED' ? (
              <button
                onClick={() => handleRunAI(false)}
                disabled={isProcessingAI || meeting?.ai_status === 'PROCESSING'}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-60"
              >
                <span>{isProcessingAI || meeting?.ai_status === 'PROCESSING' ? '⏳' : '✨'}</span>
                <span>{isProcessingAI || meeting?.ai_status === 'PROCESSING' ? 'Đang phân tích...' : 'Phân tích AI'}</span>
              </button>
            ) : (
              <ExportDropdown meetingId={meetingId!} />
            )}

            {meeting?.ai_status !== 'COMPLETED' && (
              <ExportDropdown meetingId={meetingId!} />
            )}

            {meeting?.meeting_url && (
              <a
                href={meeting.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors shadow-sm"
              >
                <span>Google Meet</span>
                <span className="text-slate-400">↗</span>
              </a>
            )}

            {/* 3-dots More Actions Dropdown */}
            <div className="relative" ref={moreActionsRef}>
              <button
                onClick={() => setShowMoreActions(!showMoreActions)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold transition-colors flex items-center justify-center w-8 h-8"
                title="Thêm thao tác"
                aria-label="Thêm thao tác"
              >
                •••
              </button>

              {showMoreActions && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs animate-in fade-in duration-100">
                  {meeting?.ai_status === 'COMPLETED' && (
                    meeting?.user_role === 'OWNER' ? (
                      <button
                        onClick={() => {
                          setShowMoreActions(false);
                          handleRunAI(true);
                        }}
                        disabled={isProcessingAI}
                        className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center space-x-2 transition-colors disabled:opacity-50"
                      >
                        <span>🔄</span>
                        <span>Phân tích lại với Gemini</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        title="Chỉ chủ phòng mới có thể yêu cầu phân tích lại"
                        className="w-full text-left px-3.5 py-2 text-slate-400 flex items-center space-x-2 cursor-not-allowed"
                      >
                        <span>🔄</span>
                        <span>Phân tích lại (Chỉ chủ trì)</span>
                      </button>
                    )
                  )}

                  {meeting?.google_sheets_url && (
                    <a
                      href={meeting.google_sheets_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowMoreActions(false)}
                      className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center space-x-2 transition-colors"
                    >
                      <span>📊</span>
                      <span>Mở Google Sheets</span>
                    </a>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  {meeting?.user_role === 'OWNER' && meeting?.status === 'in_progress' ? (
                    <div className="px-3.5 py-1.5 text-slate-400 text-[11px] italic">
                      Không thể xóa khi đang diễn ra
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowMoreActions(false);
                        setShowDeleteModal(true);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center space-x-2 transition-colors ${
                        meeting?.user_role === 'PARTICIPANT'
                          ? 'hover:bg-blue-50 text-blue-700'
                          : 'hover:bg-rose-50 text-rose-700'
                      }`}
                    >
                      <span>{meeting?.user_role === 'PARTICIPANT' ? '👁️' : '🗑️'}</span>
                      <span>{meeting?.user_role === 'PARTICIPANT' ? 'Ẩn khỏi danh sách' : 'Xóa cuộc họp'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action / Notification Banner */}
        {actionMessage && (
          <div
            className={`p-3.5 rounded-lg text-xs font-medium flex items-center justify-between animate-in fade-in duration-200 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : actionMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>{actionMessage.type === 'success' ? '✅' : actionMessage.type === 'error' ? '❌' : 'ℹ️'}</span>
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-slate-600 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Metadata info strip */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-[11px]">Bắt đầu:</span>
            <span className="font-medium text-slate-800">
              {meeting?.start_time
                ? new Date(meeting.start_time).toLocaleString('vi-VN')
                : new Date(meeting!.created_at).toLocaleString('vi-VN')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Kết thúc:</span>
            <span className="font-medium text-slate-800">
              {meeting?.end_time ? new Date(meeting.end_time).toLocaleString('vi-VN') : 'Chưa kết thúc'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Người tham gia:</span>
            <div className="flex items-center space-x-1 mt-0.5 flex-wrap">
              <span className="font-medium text-slate-800">
                {participantCount} thành viên
              </span>
              {participantNames.length > 0 && (
                <span
                  className="text-[11px] text-indigo-600 font-medium truncate max-w-[140px]"
                  title={participantNames.join(', ')}
                >
                  ({participantNames.slice(0, 2).join(', ')}
                  {participantNames.length > 2 ? ` +${participantNames.length - 2}` : ''})
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Đoạn hội thoại:</span>
            <span className="font-medium text-slate-800">
              {transcriptView?.total_entries || 0} câu
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex space-x-4">
        <button
          onClick={() => setActiveTab('transcript')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'transcript'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>📝</span>
          <span>Biên bản Transcript</span>
          {transcriptView && transcriptView.total_entries > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-mono">
              {transcriptView.total_entries}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'summary'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>✨</span>
          <span>Tóm tắt AI</span>
        </button>

        <button
          onClick={() => setActiveTab('actions_decisions')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'actions_decisions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>⚖️</span>
          <span>Quyết định & Việc cần làm</span>
        </button>

        <button
          onClick={() => setActiveTab('email')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'email'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>📧</span>
          <span>Follow-up Email</span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'sheets'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>📊</span>
          <span>Google Sheets</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'transcript' && (
          <TranscriptViewer
            transcriptView={transcriptView}
            loading={loadingTranscript}
            targetTimestamp={targetTimestamp}
            onClearTargetTimestamp={() => setTargetTimestamp(null)}
            onDeleteMeeting={
              meeting?.user_role === 'OWNER' && meeting?.status === 'in_progress'
                ? undefined
                : () => setShowDeleteModal(true)
            }
            userRole={meeting?.user_role}
          />
        )}

        {activeTab === 'summary' && (
          <SummaryOverview
            aiOutput={aiOutput}
            observability={observability}
            onSelectTimestamp={handleJumpToTranscript}
          />
        )}

        {activeTab === 'actions_decisions' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <span>⚖️</span>
                <span>Các quyết định đã chốt</span>
              </h3>
              <DecisionsTable
                decisions={aiOutput?.decisions}
                onSelectTimestamp={handleJumpToTranscript}
              />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <span>✅</span>
                <span>Nhiệm vụ & Việc cần làm (Action Items)</span>
              </h3>
              <ActionItemsTable
                actionItems={aiOutput?.action_items}
                onSelectTimestamp={handleJumpToTranscript}
              />
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <FollowUpEmail email={aiOutput?.follow_up_email} />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsView
            sheetsUrl={meeting?.google_sheets_url}
            syncStatus={meeting?.sheets_sync_status}
            onRetrySync={meeting?.user_role === 'OWNER' ? () => handleRunAI(true) : undefined}
          />
        )}
      </div>

      {/* Delete / Hide Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className={`flex items-center space-x-3 ${meeting?.user_role === 'PARTICIPANT' ? 'text-blue-600' : 'text-rose-600'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${meeting?.user_role === 'PARTICIPANT' ? 'bg-blue-50' : 'bg-rose-50'}`}>
                {meeting?.user_role === 'PARTICIPANT' ? '👁️' : '⚠️'}
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {meeting?.user_role === 'PARTICIPANT' ? 'Ẩn cuộc họp khỏi danh sách' : 'Xác nhận xóa cuộc họp'}
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {meeting?.user_role === 'PARTICIPANT' ? (
                <>
                  Bạn có chắc chắn muốn ẩn cuộc họp{' '}
                  <span className="font-semibold text-slate-900">
                    "{meeting?.title || meeting?.meeting_code || meetingId}"
                  </span>{' '}
                  khỏi danh sách cá nhân?
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn xóa cuộc họp{' '}
                  <span className="font-semibold text-slate-900">
                    "{meeting?.title || meeting?.meeting_code || meetingId}"
                  </span>
                  ?
                </>
              )}
            </p>

            {meeting?.user_role === 'PARTICIPANT' ? (
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
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteMeeting}
                disabled={isDeleting}
                className={`inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer ${
                  meeting?.user_role === 'PARTICIPANT'
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
                    <span>{meeting?.user_role === 'PARTICIPANT' ? '👁️' : '🗑️'}</span>
                    <span>{meeting?.user_role === 'PARTICIPANT' ? 'Ẩn khỏi danh sách' : 'Xác nhận xóa'}</span>
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
