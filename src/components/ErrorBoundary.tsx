import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error.message);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
          <div className="max-w-md space-y-6">
            <div className="text-6xl">😵</div>
            <h1 className="text-2xl font-bold text-foreground">
              Quelque chose s'est mal passé
            </h1>
            <p className="text-muted-foreground">
              Une erreur inattendue s'est produite. Veuillez rafraîchir la page.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="p-4 mt-4 text-sm text-left rounded-lg bg-destructive/10 text-destructive overflow-auto max-h-48">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="px-6 py-3 text-sm font-medium text-white rounded-lg bg-primary hover:bg-primary/90 transition-colors"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
