import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty ID is required'],
      index: true,
    },
    day: {
      type: String,
      required: [true, 'Day is required'],
      enum: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
    },
    startTime: {
      // Canonicalized to "HH" (2-digit) by controller
      type: String,
      required: [true, 'startTime is required'],
      match: [/^(\d{1,2})$/, 'startTime must be an hour in "HH" format'],
    },
    endTime: {
      type: String,
      required: [true, 'endTime is required'],
      match: [/^(\d{1,2})$/, 'endTime must be an hour in "HH" format'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    room: {
      type: String,
      trim: true,
      default: undefined,
    },
  },
  { timestamps: true }
);

// Ensure startTime < endTime (cross-field validation).
timetableSchema.path('endTime').validate(function (value) {
  const start = Number(this.startTime);
  const end = Number(value);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return start < end;
}, 'endTime must be greater than startTime');

// Helpful indexes for querying by faculty/day.
timetableSchema.index({ facultyId: 1, day: 1, startTime: 1 });

// Prevent duplicates for same faculty/day/time range.
timetableSchema.index(
  { facultyId: 1, day: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

export default mongoose.model('Timetable', timetableSchema, 'Timetable');

