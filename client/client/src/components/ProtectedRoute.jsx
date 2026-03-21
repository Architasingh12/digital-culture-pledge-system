import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['admin', 'super_admin', 'company_admin'];

/**
 * allowedRoles: string[] — only these roles may access the route.
 * adminOnly: boolean — shorthand for ADMIN_ROLES.
 * participantOnly: boolean — shorthand for ['participant'].
 * If none provided, any authenticated user is allowed.
 */
const ProtectedRoute = ({ children, allowedRoles, adminOnly = false, participantOnly = false }) => {
    const { user, loading, role } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    // Determine effective allowed roles
    const effective = allowedRoles
        ? allowedRoles
        : adminOnly
            ? ADMIN_ROLES
            : participantOnly
                ? ['participant']
                : null; // null = any authenticated user

    if (effective && !effective.includes(role)) {
        // Redirect to the appropriate home for the user's actual role
        if (role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
        if (role === 'company_admin') return <Navigate to="/company/dashboard" replace />;
        return <Navigate to="/participant/dashboard" replace />;
    }

    return children ?? <Outlet />;
};

export default ProtectedRoute;
