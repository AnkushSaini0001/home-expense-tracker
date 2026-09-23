import Candidate from '../models/Candidate.js';
import { filterCandidatesForCategory } from '../utils/candidateScope.js';

// @desc    Get all candidates
// @route   GET /api/candidates
// @query   status, category (e.g. Milkman) — filters by applicableCategories
export const getCandidates = async (req, res) => {
  try {
    const { status, category } = req.query;
    const query = status ? { status } : {};
    let candidates = await Candidate.find(query).sort({ name: 1 });

    if (category) {
      candidates = filterCandidatesForCategory(candidates, category);
    }

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
