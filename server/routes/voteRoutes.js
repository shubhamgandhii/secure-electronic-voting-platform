
const express = require('express');
const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const ELECTION_ID = 'college-election-2026';

// Submit one vote per voter for this election
router.post('/', authMiddleware, async (req, res) => {
  const { candidateId } = req.body || {};

  if (
    typeof candidateId !== 'string' ||
    !mongoose.isValidObjectId(candidateId)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Please select a valid candidate.',
    });
  }

  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      // Verify that the candidate belongs to this election.
      const candidate = await Candidate.findOne({
        _id: candidateId,
        electionId: ELECTION_ID,
      }).session(session);

      if (!candidate) {
        const error = new Error(
          'Candidate not found for this election.'
        );
        error.statusCode = 404;
        throw error;
      }

      // Atomically mark the voter as having voted.
      const updatedUser = await User.findOneAndUpdate(
        {
          _id: req.user.id,
          role: 'voter',
          hasVoted: false,
        },
        {
          $set: { hasVoted: true },
        },
        {
          new: true,
          session,
        }
      );

      if (!updatedUser) {
        const error = new Error(
          'You have already voted or your account cannot vote.'
        );
        error.statusCode = 409;
        throw error;
      }

      // Save the voter, candidate and election together.
      await Vote.create(
        [
          {
            voterId: updatedUser._id,
            candidate: candidate._id,
            electionId: ELECTION_ID,
          },
        ],
        { session }
      );

      result = {
        success: true,
        message: 'Your vote has been submitted successfully.',
      };
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Vote submission error:', error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already voted in this election.',
      });
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode
          ? error.message
          : 'Unable to submit your vote. Please try again.',
    });
  } finally {
    await session.endSession();
  }
});

// Check whether the logged-in voter has voted
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const voter = await User.findById(req.user.id)
      .select('hasVoted role')
      .lean();

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    return res.status(200).json({
      success: true,
      hasVoted: voter.hasVoted,
    });
  } catch (error) {
    console.error('Vote status error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to check voting status.',
    });
  }
});

/* Admin-only election results */
router.get('/results', authMiddleware, async (req, res) => {
  try {
    // Only admins can view election results.
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required.',
      });
    }

    // Fetch all candidates, including candidates with zero votes.
    const candidates = await Candidate.find({
      electionId: ELECTION_ID,
    })
      .select('name party description electionId')
      .sort({ name: 1 })
      .lean();

    // Count votes for each candidate without exposing voter identities.
    const voteCounts = await Vote.aggregate([
      { $match: { electionId: ELECTION_ID } },
      {
        $group: {
          _id: '$candidate',
          totalVotes: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map(
      voteCounts.map((item) => [
        item._id.toString(),
        item.totalVotes,
      ])
    );

    const results = candidates.map((candidate) => ({
      id: candidate._id,
      name: candidate.name,
      party: candidate.party,
      totalVotes: countMap.get(candidate._id.toString()) || 0,
    }));

    const totalVotes = results.reduce(
      (total, candidate) => total + candidate.totalVotes,
      0
    );

    return res.status(200).json({
      success: true,
      electionId: ELECTION_ID,
      totalVotes,
      results,
    });
  } catch (error) {
    console.error('Election results error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch election results.',
    });
  }
});

module.exports = router;
