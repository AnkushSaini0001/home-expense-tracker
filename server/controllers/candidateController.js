import Candidate from "../models/Candidate.js";
import { filterCandidatesForCategory } from "../utils/candidateScope.js";
import AppError from "../utils/AppError.js";
// @desc    Get all candidates
// @route   GET /api/candidates
// @query   status, category (e.g. Milkman) — filters by applicableCategories
export const getCandidates = async (req, res, next) => {
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
    next(error);
  }
};

// @desc    Get single candidate by id
// @route   GET /api/candidates/:id
export const getCandidateById = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return next(new AppError("Candidate not found", 404));
    }

    res.json({ success: true, data: candidate });
  } catch (error) {
    next(error);
  }
};

// Create a new candidate
// @route   POST /api/candidates
// @body    name, applicableCategories, fixedDailyQuantity
export const createCandidate = async (req, res, next) => {
  try {
    const {
      name,
      applicableCategories,
      fixedDailyQuantity,
      excludedCategories,
      status,
    } = req.body;

    const findCandidate = await Candidate.findOne({ name });

    if (findCandidate) {
      // return res.status(409).json({
      //   success: false,
      //   message: "Candidate already exists",
      // });
      // const error = new Error("Candidate Already exists");
      // error.status = 409;
      // return next(error);
      return next(new AppError("Candidate aready exists", 409));
    }
    const candidate = await Candidate.create({
      name,
      applicableCategories,
      fixedDailyQuantity,
      excludedCategories,
      status,
    });
    res.status(201).json({ success: true, data: candidate });
  } catch (error) {
    // res.status(500).json({ success: false, message: error.message });

    next(error);
  }
};
