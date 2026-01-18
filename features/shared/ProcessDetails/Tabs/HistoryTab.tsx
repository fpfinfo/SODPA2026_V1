import React from 'react';
import { TimelineHistory } from '../../TimelineHistory';

interface HistoryTabProps {
  processId: string;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ processId }) => {
  return (
    <div className="p-8">
      <TimelineHistory processId={processId} />
    </div>
  );
};
