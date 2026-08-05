import { Component } from 'react';
import ErrorScreen from './ErrorScreen';
import { isChunkLoadError, reloadOnceForChunkError } from '../../utils/chunkError';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error)) {
      reloadOnceForChunkError();
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return <ErrorScreen onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}
