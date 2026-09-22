import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-4xl mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center space-x-3 text-rose-600">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-lg font-bold">Đã xảy ra sự cố hiển thị</h2>
          </div>
          <p className="text-sm text-slate-600">
            Ứng dụng gặp sự cố khi xử lý dữ liệu giao diện:{' '}
            <code className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono">
              {this.state.error?.message || 'Lỗi không xác định'}
            </code>
          </p>
          <div className="pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
