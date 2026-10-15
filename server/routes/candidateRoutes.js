
const express = require('express');
const Candidate = require('../models/Candidate');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET: Fetch all candidates (login required)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .select('name party description electionId')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    console.error('Fetch candidates error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch candidates.',
    });
  }
});

// POST: Add a candidate (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only an admin can add candidates.',
      });
    }

    const { name, party, description, electionId } = req.body;

    if (
      typeof name !== 'string' ||
      typeof party !== 'string' ||
      !name.trim() ||
      !party.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Candidate name and party are required.',
      });
    }

    const candidate = await Candidate.create({
      name: name.trim(),
      party: party.trim(),
      description:
        typeof description === 'string' ? description.trim() : '',
      electionId:
        typeof electionId === 'string' && electionId.trim()
          ? electionId.trim()
          : 'college-election-2026',
    });

    return res.status(201).json({
      success: true,
      message: 'Candidate added successfully.',
      candidate,
    });
  } catch (error) {
    console.error('Add candidate error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to add candidate.',
    });
  }
});

module.exports = router;
