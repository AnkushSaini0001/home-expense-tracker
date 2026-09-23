/**
 * Empty applicableCategories = all facilities (minus exclusions).
 * e.g. applicableCategories: ['Milkman'] → milk only (Reena).
 * e.g. excludedCategories: ['Cook'] → hide from Cook (Jatin).
 */
export const isCandidateForCategory = (candidate, category) => {
  if (!category) return true;

  const excluded = candidate.excludedCategories || [];
  if (excluded.includes(category)) return false;

  const cats = candidate.applicableCategories || [];
  if (!cats.length) return true;
  return cats.includes(category);
};

export const filterCandidatesForCategory = (candidates, category) => {
  if (!category) return candidates;
  return candidates.filter((c) => isCandidateForCategory(c, category));
};
