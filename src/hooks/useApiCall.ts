import { useLoading } from '../contexts/LoadingContext';

/**
 * Hook for making API calls with automatic global loading state management
 */
export function useApiCall() {
  const { showLoadingWithMessage, hideLoading } = useLoading();

  const makeApiCall = async <T,>(
    apiCall: () => Promise<T>,
    loadingMessage?: string,
    loadingSubmessage?: string
  ): Promise<T> => {
    try {
      showLoadingWithMessage(loadingMessage, loadingSubmessage);
      const result = await apiCall();
      return result;
    } finally {
      hideLoading();
    }
  };

  return { makeApiCall };
}
