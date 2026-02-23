import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: '/api',
    // Note: in Vite, we use a proxy to '/api', so keeping just '/api' here works as long as
    // the backend proxy supports credentials (which it does via vite.config.js usually).
    // Or we can be explicit if we have problems, but '/api' is fine.
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

// We no longer manually attach the Bearer token as it's sent automatically via the httpOnly cookie

axiosInstance.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            // Note: with contexts we should probably redirect properly or emit an event,
            // but this helps as a catch-all back-stop if the session expires completely.
            if (window.location.pathname !== '/login' && window.location.pathname !== '/verify-otp') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
