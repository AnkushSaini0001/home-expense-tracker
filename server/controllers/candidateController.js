import Candidate from '../models/Candidate.js';

// @desc    Get all candidates
// @route   GET /api/candidates
export const getCandidates = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const candidates = await Candidate.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single candidate by id
// @route   GET /api/candidates/:id
export const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
