// Turns a Date into a calendar day string like "2026-10-14".
//
// The string uses the computer's local timezone, not UTC. October 14 at
// 11pm in Sydney is still "2026-10-14" here, even though UTC is already
// the next day.
//
// module.exports at the bottom shares formatLocalDay with other Node files.
// Those files load this one and take the function off the exported object.

function formatLocalDay(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

module.exports = { formatLocalDay };
