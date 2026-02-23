import InfoLayout from '@/components/InfoLayout';

export default function PrivacyPage() {
    return (
        <InfoLayout
            title="Privacy"
            breadcrumb="Legal"
            description="Our commitment to protecting your personal data and privacy."
        >
            <h3>1. Information We Collect</h3>
            <p>We collect information you provide directly to us, such as when you create an account, fill out a form, or communicate with us.</p>
            <h3>2. How We Use Information</h3>
            <p>We use the information we collect to provide, maintain, and improve our services, and to develop new ones.</p>
            <h3>3. Data Security</h3>
            <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access.</p>
        </InfoLayout>
    );
}
