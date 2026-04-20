const User = require('../models/User');
const Staff = require('../models/Staff');

/**
 * Resolves the Staff document for a logged-in LIC user.
 * Course.lic references Staff; login uses User — we match via User.staff or same email.
 */
async function getStaffIdForLicUser(user) {
  if (!user?._id) return null;

  const u = await User.findById(user._id).select('staff email');
  if (!u) return null;
  if (u.staff) return u.staff;

  const byEmail = await Staff.findOne({ email: u.email.toLowerCase() });
  return byEmail?._id || null;
}

/**
 * Build Mongo query for "courses owned by this LIC" (Staff id + legacy User id on course.lic).
 */
async function licCourseFilter(user) {
  const staffId = await getStaffIdForLicUser(user);
  const or = [{ lic: user._id }];
  if (staffId) or.push({ lic: staffId });
  return { isActive: true, $or: or };
}

async function userOwnsLicCourse(user, courseDoc) {
  if (!courseDoc?.lic) return false;
  const licStr = courseDoc.lic.toString();
  if (licStr === user._id.toString()) return true;
  const staffId = await getStaffIdForLicUser(user);
  return staffId ? licStr === staffId.toString() : false;
}

module.exports = {
  getStaffIdForLicUser,
  licCourseFilter,
  userOwnsLicCourse
};
