export type TimelineAction = {
  status: string;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
};

export function isOpenTimelineAction(action: TimelineAction) {
  return action.status === "pending" || action.status === "in_progress" || action.status === "postponed";
}

export function sortActionTimeline<T extends TimelineAction>(actions: T[]) {
  return [...actions].sort((a, b) => {
    const openDifference = Number(isOpenTimelineAction(b)) - Number(isOpenTimelineAction(a));
    if (openDifference !== 0) return openDifference;

    const aDate = (a.dueDate ?? a.completedAt ?? a.createdAt).getTime();
    const bDate = (b.dueDate ?? b.completedAt ?? b.createdAt).getTime();
    return isOpenTimelineAction(a) ? aDate - bDate : bDate - aDate;
  });
}
