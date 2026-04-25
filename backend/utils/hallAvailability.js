const Timetable = require('../models/Timetable');
const Hall = require('../models/Hall');
const Batch = require('../models/Batch');

const getHallAvailability = async ({
  day,
  startTime,
  endTime,
  type,
  location,
  batchId,
  excludeEntryId
}) => {
  if (!day || !startTime || !endTime) {
    const error = new Error('day, startTime, and endTime are required');
    error.statusCode = 400;
    throw error;
  }

  const hallQuery = { isActive: true };
  if (type) hallQuery.type = type;
  if (location) hallQuery.location = location;

  const [halls, overlappingEntries, batch] = await Promise.all([
    Hall.find(hallQuery).sort('hallCode').lean(),
    Timetable.find({
      day,
      status: { $ne: 'cancelled' },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
      ...(excludeEntryId ? { _id: { $ne: excludeEntryId } } : {})
    })
      .populate('course', 'courseCode courseName')
      .populate('batch', 'batchCode studentCount')
      .populate('hall', 'hallCode hallName capacity location type')
      .lean(),
    batchId ? Batch.findOne({ _id: batchId, isActive: true }).lean() : Promise.resolve(null)
  ]);

  const entriesByHallId = overlappingEntries.reduce((acc, entry) => {
    const hallId = entry.hall?._id?.toString();
    if (!hallId) return acc;

    if (!acc[hallId]) {
      acc[hallId] = [];
    }

    acc[hallId].push({
      id: entry._id,
      courseCode: entry.course?.courseCode || 'N/A',
      courseName: entry.course?.courseName || 'Unknown course',
      batchCode: entry.batch?.batchCode || 'N/A',
      batchStudentCount: entry.batch?.studentCount || 0,
      startTime: entry.startTime,
      endTime: entry.endTime,
      status: entry.status
    });

    return acc;
  }, {});

  const availability = halls.map((hall) => {
    const conflicts = entriesByHallId[hall._id.toString()] || [];
    const canFitBatch = batch ? hall.capacity >= batch.studentCount : true;

    return {
      ...hall,
      isAvailable: conflicts.length === 0,
      canFitBatch,
      capacityShortfall: batch && !canFitBatch ? batch.studentCount - hall.capacity : 0,
      conflictingEntries: conflicts
    };
  });

  return {
    day,
    startTime,
    endTime,
    requestedType: type || 'all',
    requestedLocation: location || 'all',
    batch: batch
      ? {
          _id: batch._id,
          batchCode: batch.batchCode,
          studentCount: batch.studentCount
        }
      : null,
    summary: {
      total: availability.length,
      available: availability.filter((hall) => hall.isAvailable).length,
      unavailable: availability.filter((hall) => !hall.isAvailable).length,
      suitableForBatch: batch
        ? availability.filter((hall) => hall.canFitBatch).length
        : availability.length
    },
    halls: availability
  };
};

module.exports = { getHallAvailability };




