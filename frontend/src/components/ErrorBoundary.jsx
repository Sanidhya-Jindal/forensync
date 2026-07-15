import { Component } from 'react';

/**
 * React Error Boundary — catches render-time errors in child components
 * and displays a fallback UI instead of a blank white screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console for debugging — swap for a real error service in production
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#0D0D0D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '56px',
                height: '56px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: '24px',
              }}
            >
              ⚠
            </div>

            <h1 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#9B9B9B', fontSize: '0.875rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              An unexpected error occurred in this part of the application. You can
              try to recover, or reload the page if the problem persists.
            </p>

            {/* Error detail (collapsed by default) */}
            {this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  background: '#0D0D0D',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.75rem',
                  color: '#ef4444',
                  wordBreak: 'break-word',
                }}
              >
                <summary style={{ cursor: 'pointer', color: '#9B9B9B', marginBottom: '0.5rem' }}>
                  Error details
                </summary>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  background: '#fff',
                  color: '#0D0D0D',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.625rem 1.25rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'transparent',
                  color: '#9B9B9B',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '0.625rem 1.25rem',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
