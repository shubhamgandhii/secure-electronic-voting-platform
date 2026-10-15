
const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    voterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    electionId: {
      type: String,
      required: true,
      trim: true,
      default: 'college-election-2026',
    },
  },
  {
    timestamps: true,
  }
);

// One vote per voter for each election
voteSchema.index(
  { voterId: 1, electionId: 1 },
  { unique: true }
);

module.exports = mongoose.model('Vote', voteSchema);
