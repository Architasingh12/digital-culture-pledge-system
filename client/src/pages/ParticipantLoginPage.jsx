import RoleLoginPage from './RoleLoginPage';

const ParticipantLoginPage = () => (
    <RoleLoginPage
        title="Participant Portal"
        subtitle="Sign your digital culture pledge"
        icon="🏛️"
        accentFrom="from-[#0f172a]"
        accentTo="to-[#065f46]"
        expectedRole="participant"
        dashboardPath="/participant/dashboard"
    />
);

export default ParticipantLoginPage;
