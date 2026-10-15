
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./db');
const Candidate = require('./models/Candidate');

const sampleCandidates = [
  {
    name: 'Oliver Bennett',
    party: 'Progressive Alliance',
    description:
      'Focused on improving education, student welfare and community development.',
    electionId: 'college-election-2026',
  },
  {
    name: 'Charlotte Williams',
    party: 'United Community Party',
    description:
      'Committed to equal opportunities, student representation and inclusion.',
    electionId: 'college-election-2026',
  },
  {
    name: 'Harry Thompson',
    party: 'Future Forward Party',
    description:
      'Focused on digital innovation, sustainability and better campus facilities.',
    electionId: 'college-election-2026',
  },
];

async function seedCandidates() {
  try {
    await connectDB();

    // Update existing demo candidates if they already exist.
    const existingCandidates = await Candidate.find({
      electionId: 'college-election-2026',
    }).sort({ createdAt: 1 });

    if (existingCandidates.length > 0) {
      for (
        let i = 0;
        i < Math.min(existingCandidates.length, sampleCandidates.length);
        i++
      ) {
        existingCandidates[i].name = sampleCandidates[i].name;
        existingCandidates[i].party = sampleCandidates[i].party;
        existingCandidates[i].description =
          sampleCandidates[i].description;

        await existingCandidates[i].save();
      }

      // Insert any missing demo candidates.
      if (existingCandidates.length < sampleCandidates.length) {
        await Candidate.insertMany(
          sampleCandidates.slice(existingCandidates.length)
        );
      }

      console.log('UK-style demo candidates updated successfully!');
    } else {
      await Candidate.insertMany(sampleCandidates);
      console.log('UK-style demo candidates added successfully!');
    }
  } catch (error) {
    console.error('Unable to seed candidates:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedCandidates();
