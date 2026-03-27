import Timetable from '../models/Timetable.js';
import { normalizeHourToHH, parseHourToMinutes } from '../utils/timeUtils.js';

const DAY_ORDER = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
};

function normalizeRequestTimes({ startTime, endTime }) {
  const normalizedStartTime = normalizeHourToHH(startTime);
  const normalizedEndTime = normalizeHourToHH(endTime);

  const startMinutes = parseHourToMinutes(normalizedStartTime);
  const endMinutes = parseHourToMinutes(normalizedEndTime);

  if (startMinutes >= endMinutes) {
    throw new Error('startTime must be less than endTime');
  }

  return { normalizedStartTime, normalizedEndTime };
}

function assertFacultyRole(req) {
  if (!req.user || req.user.role !== 'faculty') {
    const err = new Error('Only faculty members can manage timetable');
    err.statusCode = 403;
    throw err;
  }
}

export const addTimetableEntry = async (req, res) => {
  try {
    assertFacultyRole(req);

    const { day, startTime, endTime, subject, room } = req.body;
    if (!day || !startTime || !endTime || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Please provide day, startTime, endTime, and subject',
      });
    }

    const { normalizedStartTime, normalizedEndTime } = normalizeRequestTimes({
      startTime,
      endTime,
    });

    // Duplicate prevention for same day + exact time range.
    const existing = await Timetable.findOne({
      facultyId: req.user.id,
      day,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Timetable entry already exists for this time slot',
      });
    }

    const entry = await Timetable.create({
      facultyId: req.user.id,
      day,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      subject: String(subject).trim(),
      room: room ? String(room).trim() : undefined,
    });

    return res.status(201).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    const statusCode = error?.statusCode || 400;
    return res.status(statusCode).json({
      success: false,
      message: error?.message || 'Failed to add timetable entry',
    });
  }
};

export const getFacultyTimetable = async (req, res) => {
  try {
    assertFacultyRole(req);

    const { day } = req.query;
    const filter = { facultyId: req.user.id };
    if (day) filter.day = day;

    const entries = await Timetable.find(filter).sort([
      // When day is not filtered, sort by day then time.
      { day: 1 },
      { startTime: 1 },
    ]);

    // If day was not supplied, make day ordering deterministic using DAY_ORDER.
    const sortedEntries = day
      ? entries
      : entries.sort((a, b) => {
          const da = DAY_ORDER[a.day] ?? 999;
          const db = DAY_ORDER[b.day] ?? 999;
          if (da !== db) return da - db;
          return String(a.startTime).localeCompare(String(b.startTime));
        });

    return res.status(200).json({
      success: true,
      count: sortedEntries.length,
      data: sortedEntries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch timetable',
    });
  }
};

export const updateTimetableEntry = async (req, res) => {
  try {
    assertFacultyRole(req);

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Timetable entry id is required' });
    }

    const existing = await Timetable.findOne({ _id: id, facultyId: req.user.id });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    }

    const { day, startTime, endTime, subject, room } = req.body;

    // If any of day/times are provided, require all needed ones.
    const hasTimeUpdates = startTime != null || endTime != null;
    if (hasTimeUpdates && (!day || startTime == null || endTime == null)) {
      return res.status(400).json({
        success: false,
        message: 'To update timetable time slot, provide day, startTime, and endTime',
      });
    }

    let normalizedStartTime = existing.startTime;
    let normalizedEndTime = existing.endTime;
    let nextDay = existing.day;

    if (day != null) nextDay = day;
    if (startTime != null || endTime != null) {
      const normalized = normalizeRequestTimes({ startTime, endTime });
      normalizedStartTime = normalized.normalizedStartTime;
      normalizedEndTime = normalized.normalizedEndTime;
    }

    // Duplicate prevention: check other records for same faculty/day/time range.
    const duplicate = await Timetable.findOne({
      _id: { $ne: existing._id },
      facultyId: req.user.id,
      day: nextDay,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'Timetable entry already exists for this time slot',
      });
    }

    existing.day = nextDay;
    existing.startTime = normalizedStartTime;
    existing.endTime = normalizedEndTime;
    if (subject != null) existing.subject = String(subject).trim();
    if (room !== undefined) existing.room = room ? String(room).trim() : undefined;

    await existing.save();

    return res.status(200).json({
      success: true,
      data: existing,
    });
  } catch (error) {
    const statusCode = error?.statusCode || 400;
    return res.status(statusCode).json({
      success: false,
      message: error?.message || 'Failed to update timetable entry',
    });
  }
};

export const deleteTimetableEntry = async (req, res) => {
  try {
    assertFacultyRole(req);

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Timetable entry id is required' });
    }

    const result = await Timetable.findOneAndDelete({ _id: id, facultyId: req.user.id });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Timetable entry deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to delete timetable entry',
    });
  }
};

/**
 * Bonus: Return available time slots for a given faculty + day.
 * Uses the complement of teaching intervals.
 *
 * Query params:
 * - day: required ("Monday"...)
 * - slotDurationMinutes: optional, defaults to 30
 *
 * Returns discrete slot start times where a meeting of slotDurationMinutes fits in a free interval.
 */
export const getAvailableSlotsForFacultyDay = async (req, res) => {
  try {
    assertFacultyRole(req);

    const { day } = req.query;
    const slotDurationMinutes = Number(req.query.slotDurationMinutes ?? 30);

    if (!day) {
      return res.status(400).json({ success: false, message: 'day query param is required' });
    }
    if (!Number.isFinite(slotDurationMinutes) || slotDurationMinutes <= 0) {
      return res.status(400).json({ success: false, message: 'slotDurationMinutes must be a positive number' });
    }

    const entries = await Timetable.find({ facultyId: req.user.id, day }).sort({ startTime: 1 });

    // If no timetable exists, everything is available.
    if (!entries.length) {
      const slots = [];
      for (let m = 0; m + slotDurationMinutes <= 24 * 60; m += slotDurationMinutes) {
        const hh = String(Math.floor(m / 60)).padStart(2, '0');
        const mm = String(m % 60).padStart(2, '0');
        const endM = m + slotDurationMinutes;
        const endH = String(Math.floor(endM / 60)).padStart(2, '0');
        const endMm = String(endM % 60).padStart(2, '0');
        slots.push({ startTime: `${hh}:${mm}`, endTime: `${endH}:${endMm}` });
      }

      return res.status(200).json({
        success: true,
        count: slots.length,
        data: slots,
      });
    }

    const teachingIntervals = entries
      .map((e) => ({
        start: parseHourToMinutes(e.startTime),
        end: parseHourToMinutes(e.endTime),
      }))
      .filter((i) => i.start < i.end);

    // Merge overlapping teaching intervals.
    teachingIntervals.sort((a, b) => a.start - b.start);
    const mergedTeaching = [];
    for (const interval of teachingIntervals) {
      const last = mergedTeaching[mergedTeaching.length - 1];
      if (!last || interval.start >= last.end) {
        mergedTeaching.push({ ...interval });
      } else {
        last.end = Math.max(last.end, interval.end);
      }
    }

    // Compute free intervals in [0, 1440)
    const freeIntervals = [];
    let cursor = 0;
    for (const t of mergedTeaching) {
      if (cursor < t.start) freeIntervals.push({ start: cursor, end: t.start });
      cursor = Math.max(cursor, t.end);
    }
    if (cursor < 24 * 60) freeIntervals.push({ start: cursor, end: 24 * 60 });

    const slots = [];
    for (const free of freeIntervals) {
      for (let m = free.start; m + slotDurationMinutes <= free.end; m += slotDurationMinutes) {
        const hh = String(Math.floor(m / 60)).padStart(2, '0');
        const mm = String(m % 60).padStart(2, '0');
        const endM = m + slotDurationMinutes;
        const endH = String(Math.floor(endM / 60)).padStart(2, '0');
        const endMm = String(endM % 60).padStart(2, '0');
        slots.push({ startTime: `${hh}:${mm}`, endTime: `${endH}:${endMm}` });
      }
    }

    // Sort by start time already due to construction; still ensure.
    slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to compute available slots',
    });
  }
};

