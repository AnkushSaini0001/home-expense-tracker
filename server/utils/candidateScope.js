/**
 * Empty applicableCategories = all facilities.
 * e.g. ['Milkman'] means milk only (Reena).
 */
export const isCandidateForCategory = (candidate, category) => {
  const cats = candidate.applicableCategories || [];
  if (!cats.length) return true;
  return cats.includes(category);
};

export const filterCandidatesForCategory = (candidates, category) => {
  if (!category) return candidates;
  return candidates.filter((c) => isCandidateForCategory(c, category));
};
