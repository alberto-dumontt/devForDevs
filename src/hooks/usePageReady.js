import { useContext, useEffect } from 'react';
import { PageLoadingContext } from '../contexts/PageLoadingContext';

export function usePageReady(loading) {
  const notifyReady = useContext(PageLoadingContext);
  useEffect(() => {
    if (!loading) notifyReady?.();
  }, [loading, notifyReady]);
}
