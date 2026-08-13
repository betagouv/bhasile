"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, ErrorInfo, PropsWithChildren, ReactNode } from "react";

export class ContentErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return this.props.fallback;
  }
}

type Props = PropsWithChildren<{ fallback: ReactNode }>;

type State = { hasError: boolean };
