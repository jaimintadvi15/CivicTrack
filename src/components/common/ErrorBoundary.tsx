import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error in Urban Fix:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = window.location.origin;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4 text-[#202124] font-sans">
          <div className="w-full max-w-md bg-white border border-[#DADCE0] rounded-xl shadow-lg p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="w-full h-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] absolute top-0 left-0" />

            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#FCE8E6] text-[#C5221F] flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-bold text-[#202124] mb-2">Something went wrong</h1>
            <p className="text-sm text-[#5F6368] mb-6">
              The application encountered an unexpected issue while loading. You can try refreshing the page or resetting your local session.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-[#F1F3F4] rounded-lg text-left text-xs font-mono text-[#3C4043] overflow-auto max-h-32 border border-[#DADCE0]">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-[#4285F4] hover:bg-[#1A73E8] text-white font-medium text-sm rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleResetAndReload}
                className="flex-1 py-2.5 px-4 bg-white hover:bg-[#F8F9FA] text-[#5F6368] hover:text-[#C5221F] font-medium text-sm rounded-lg border border-[#DADCE0] flex items-center justify-center space-x-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset & Restart</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
