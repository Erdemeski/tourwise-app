export const mapDaysToWaypointList = (days = []) => {
  if (!Array.isArray(days)) {
    return [];
  }

  return days.flatMap((day, dayIndex) => {
    const stops = Array.isArray(day?.stops) ? day.stops : [];
    const dayNumber = typeof day?.dayNumber === 'number' ? day.dayNumber : dayIndex + 1;

    return stops.map((stop, stopIndex) => ({
      title: stop?.name ?? `Stop ${stopIndex + 1}`,
      summary: stop?.description ?? '',
      day: dayNumber,
      order: stopIndex,
      location: stop?.location?.address ?? stop?.address ?? '',
      latitude: stop?.location?.geo?.lat ?? null,
      longitude: stop?.location?.geo?.lng ?? null,
      startTime: stop?.startTime ?? '',
      endTime: stop?.endTime ?? '',
      notes: stop?.notes ?? '',
      resources: Array.isArray(stop?.resources) ? stop.resources : [],
    }));
  });
};


