import { Navigate } from 'react-router-dom';

// OTP authentication has been removed. Redirect any legacy bookmark to /login.
const OtpVerifyPage = () => <Navigate to="/login" replace />;

export default OtpVerifyPage;
