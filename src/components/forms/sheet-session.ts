'use client';

import { useEffect, useRef, useState } from 'react';

export function useSheetSessionKey(open: boolean, discriminator = '') {
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    if (open) {
      setSessionKey((current) => current + 1);
    }
  }, [open, discriminator]);

  return sessionKey;
}

export function useCloseOnSuccess(status: 'idle' | 'success' | 'error', onSuccess: () => void) {
  const previousStatus = useRef(status);

  useEffect(() => {
    if (previousStatus.current !== 'success' && status === 'success') {
      onSuccess();
    }

    previousStatus.current = status;
  }, [status, onSuccess]);
}
