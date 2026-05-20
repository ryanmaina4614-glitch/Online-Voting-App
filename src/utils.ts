import { ElectionStatus } from './types';

export function getCorrectedStatus(startDate: string, endDate: string): ElectionStatus {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    return ElectionStatus.UPCOMING;
  } else if (now >= start && now <= end) {
    return ElectionStatus.ACTIVE;
  } else {
    return ElectionStatus.COMPLETED;
  }
}
