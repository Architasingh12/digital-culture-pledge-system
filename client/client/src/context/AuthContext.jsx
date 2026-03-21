import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const ADMIN_ROLES = ['admin', 'super_admin', 'company_admin'];

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await axiosInstance.get('/auth/me');
                if (res.data.success && res.data.user) {
                    setUser(res.data.user);
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = (userData) => setUser(userData);

    const logout = async () => {
        try {
            await axiosInstance.post('/auth/logout');
            setUser(null);
            window.location.href = '/login';
        } catch {
            toast.error('Error logging out');
        }
    };

    const role = user?.role ?? null;

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            loading,
            role,
            isAdmin: ADMIN_ROLES.includes(role),
            isSuperAdmin: role === 'super_admin',
            isCompanyAdmin: role === 'company_admin' || role === 'admin',
            isParticipant: role === 'participant',
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
