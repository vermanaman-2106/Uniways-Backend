import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    type: {
      type: String,
      required: [true, 'Complaint type is required'],
      enum: [
        'ac',
        'projector',
        'hdmi_cable',
        'wifi',
        'furniture',
        'cleanliness',
        'power_outlet',
        'whiteboard',
        'sound_system',
        'lights',
        'water_dispenser',
        'other'
      ],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      // e.g., "Room 101", "Lab A", "Building B - Floor 2"
    },
    building: {
      type: String,
      trim: true,
      // e.g., "Engineering Block", "Main Building"
    },
    floor: {
      type: String,
      trim: true,
      // e.g., "Ground Floor", "2nd Floor"
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'closed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Maintenance staff or admin who is handling the complaint
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
    attachments: [{
      type: String,
      // URLs or paths to attached images/files
    }],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
complaintSchema.index({ userId: 1, createdAt: -1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ type: 1 });
complaintSchema.index({ priority: 1, createdAt: -1 });

export default mongoose.model('Complaint', complaintSchema, 'Complaint');

