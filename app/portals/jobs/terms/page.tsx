import { InfoLayout } from '@/components/ui';

export default function TermsPage() {
    return (
        <InfoLayout
            title="Terms of"
            breadcrumb="Legal"
            description="The rules and guidelines for using the TalentMesh platform."
        >
            <h3>1. Agreement to Terms</h3>
            <p>By accessing or using our services, you agree to be bound by these terms.</p>
            <h3>2. User Responsibilities</h3>
            <p>You are responsible for your use of the services and for any content you provide.</p>
            <h3>3. Intellectual Property</h3>
            <p>The services and their original content, features, and functionality are owned by TalentMesh.</p>
        </InfoLayout>
    );
}


