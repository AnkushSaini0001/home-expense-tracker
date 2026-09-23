/**
 * Client helper — mirrors server/utils/candidateScope.js
 */
export const isCandidateForCategory = (candidate, category) => {
  if (!category || !candidate) return true;

  const excluded = candidate.excludedCategories || [];
  if (excluded.includes(category)) return false;

  const cats = candidate.applicableCategories || [];
  if (!cats.length) return true;
  return cats.includes(category);
};
