import RoleLoginPage from './RoleLoginPage';

const AdminLoginPage = () => (
    <RoleLoginPage
        title="Super Admin Portal"
        subtitle="System-wide administration access"
        icon="🛡️"
        accentFrom="from-[#0f172a]"
        accentTo="to-[#4c1d95]"
        expectedRole="super_admin"
        dashboardPath="/admin/dashboard"
    />
);

export default AdminLoginPage;
