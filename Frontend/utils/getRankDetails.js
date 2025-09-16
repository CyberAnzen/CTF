// utils/getRankDetails.js

export default function getRankDetails(data, type, id) {
  if (!Array.isArray(data) || !id || !type) return null;

  // Normalize type
  const isTeam = type.toLowerCase() === "team";

  // Find by teamId (works for both solo and team entries since all have teamId)
  const result = data.find(
    (item) =>
      item.teamId === id &&
      (isTeam ? item.isTeam === "team" : item.isTeam === "solo")
  );

  return result || null;
}
