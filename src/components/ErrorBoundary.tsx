import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  onRetry?: () => void;
  isModal?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'تنبيه في واجهة النظام';
      const message =
        this.props.fallbackMessage ||
        'حدث خطأ غير متوقع أثناء معالجة بيانات الشاشة. يمكنك استعادة الصفحة فوراً دون فقدان أي بيانات محفوظة.';

      if (this.props.isModal) {
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            dir="rtl"
            role="alertdialog"
            aria-modal="true"
          >
            <div className="max-w-md w-full ios-card p-6 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-[var(--ios-red)]/10 flex items-center justify-center mx-auto mb-3 text-[var(--ios-red)]">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-bold text-[var(--ios-text)] mb-1.5">{title}</h3>
              <p className="text-xs text-[var(--ios-label-secondary)] mb-5 leading-relaxed">{message}</p>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="px-5 py-2.5 rounded-xl bg-[var(--ios-blue)] text-white font-semibold text-xs flex items-center gap-2 active:opacity-80 transition"
                  title="إعادة تحميل المكون دون إغلاق المودال"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>إعادة المحاولة (Retry)</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-4 py-2.5 rounded-xl bg-[var(--ios-label-secondary)]/15 text-[var(--ios-text)] font-semibold text-xs flex items-center gap-2 active:opacity-70 transition"
                >
                  <span>إغلاق النافذة</span>
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="ios-page min-h-screen flex items-center justify-center p-6 dir-rtl">
          <div className="max-w-md w-full ios-card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--ios-red)]/10 flex items-center justify-center mx-auto mb-4 text-[var(--ios-red)]">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-[var(--ios-text)] mb-2">{title}</h2>
            <p className="text-xs text-[var(--ios-label-secondary)] mb-6 leading-relaxed">{message}</p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl bg-[var(--ios-blue)] text-white font-semibold text-xs flex items-center gap-2 active:opacity-80 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2.5 rounded-xl bg-[var(--ios-label-secondary)]/15 text-[var(--ios-text)] font-semibold text-xs flex items-center gap-2 active:opacity-70 transition"
              >
                <Home className="w-4 h-4" />
                <span>تحديث الصفحة</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
