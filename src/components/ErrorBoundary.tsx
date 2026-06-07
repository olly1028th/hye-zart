import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-8 text-center">
          <p className="text-3xl mb-3">⚠️</p>
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            {this.props.fallbackMessage || '문제가 발생했습니다'}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-piano-highlight hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
