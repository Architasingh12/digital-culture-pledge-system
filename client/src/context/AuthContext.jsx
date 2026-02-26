import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Automatically fetch User session from the HTTP-Only cookie when app loads
        const checkSession = async () => {
            try {
                const res = await axiosInstance.get('/auth/me');
                if (res.data.success && res.data.user) {
                    setUser(res.data.user);
                }
            } catch {
                // Ignore 401s here, just means unauthenticated as expected
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await axiosInstance.post('/auth/logout');
            setUser(null);
            // Let axios redirect if needed or handle it here
            window.location.href = '/login';
        } catch {
            toast.error('Error logging out');
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAdmin: user?.role === 'admin' }}>
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
