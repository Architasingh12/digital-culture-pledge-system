import RoleLoginPage from './RoleLoginPage';

const CompanyLoginPage = () => (
    <RoleLoginPage
        title="Company Admin Portal"
        subtitle="Manage your organisation's pledge programme"
        icon="🏢"
        accentFrom="from-[#0f172a]"
        accentTo="to-[#1d4ed8]"
        expectedRole="company_admin"
        dashboardPath="/company/dashboard"
    />
);

export default CompanyLoginPage;
