// backend/middleware/rbacMiddleware.js

/**
 * 🔐 RBAC Middleware
 * Usage: allowRoles("admin", "safety_officer")
 */

function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(403).json({
        error: "No role assigned"
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Access denied",
        role: userRole
      });
    }

    next();
  };
}

module.exports = { allowRoles };