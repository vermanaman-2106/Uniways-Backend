import User from "../models/User.js";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/users/search?query=
 * Faculty-only. Matches students whose email contains the query (case-insensitive).
 * College emails store the student identifier in the local part, so searching e.g. "24300"
 * matches naman.2430030314@muj.manipal.edu.
 */
export const searchUsers = async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res.status(403).json({
        success: false,
        message: "Only faculty can search for students",
      });
    }

    const raw = typeof req.query.query === "string" ? req.query.query.trim() : "";
    if (!raw) {
      return res.json({ success: true, data: [] });
    }

    const escaped = escapeRegex(raw);
    const pattern = new RegExp(escaped, "i");

    const localPartExpr = {
      $regexMatch: {
        input: { $arrayElemAt: [{ $split: ["$email", "@"] }, 0] },
        regex: escaped,
        options: "i",
      },
    };

    const users = await User.find({
      role: "student",
      $or: [{ email: pattern }, { $expr: localPartExpr }],
    })
      .select("name email")
      .limit(25)
      .lean();

    const data = users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
