import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SessionLogStatus } from '../services/sessionLog';
import { formatDateTime } from '../utils/dateTime';

const DOT_CLASSES: Record<SessionLogStatus['state'], string> = {
  idle: 'bg-gray-300',
  saving: 'bg-amber-400 animate-pulse',
  saved: 'bg-green-500',
  error: 'bg-red-500',
};

/** The session-log notice and save state under a tool's drop zone (see services/sessionLog.ts). */
const SessionLogStatusLine: React.FC<{ status: SessionLogStatus; sessionId: string | null }> = ({ status, sessionId }) => {
  const { t } = useTranslation();

  let text: string;
  switch (status.state) {
    case 'idle':
      text = t('sessionLog.statusIdle');
      break;
    case 'saving':
      text = t('sessionLog.statusSaving');
      break;
    case 'saved':
      text = status.target === 'server'
        ? t('sessionLog.statusSavedServer', { time: formatDateTime(status.at) })
        : t('sessionLog.statusSavedLocal', { time: formatDateTime(status.at) });
      break;
    case 'error':
      text = t('sessionLog.statusError', { error: status.message });
      break;
  }

  return (
    <div className="mt-3 space-y-0.5 text-[11px] text-gray-500">
      <p>{t('sessionLog.notice')}</p>
      <p className="inline-flex items-center gap-1.5" role="status" data-session-log-state={status.state}>
        <span className={`inline-block h-2 w-2 rounded-full ${DOT_CLASSES[status.state]}`} aria-hidden="true" />
        <span>{text}</span>
        {sessionId && <span className="text-gray-400">· {t('sessionLog.sessionId', { id: sessionId.slice(0, 8) })}</span>}
      </p>
    </div>
  );
};

export default SessionLogStatusLine;
