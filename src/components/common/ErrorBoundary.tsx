import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  declare readonly props: Readonly<ErrorBoundaryProps>;
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled application error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[var(--surface-page)] p-6 text-[var(--text-primary)]">
          <section className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-8 text-center shadow-xl">
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
              Something went wrong
            </p>
            <h1 className="mt-2 text-2xl font-bold">Unable to load this page</h1>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Your data has not been changed. Refresh the page to try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Refresh page
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
