import React from 'react';
import UnderConstruction from '@/components/UnderConstruction';
import FeaturesComingSoon from '@/components/landing/FeaturesComingSoon';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Coming Soon | TalentMesh',
    description: 'Something amazing is in the works. Stay tuned for our new features.',
};

export default function ComingSoonPage() {
    return (
        <div style={{ background: '#f8fafc' }}>
            <UnderConstruction
                title="Coming Soon"
                message="We are working hard to bring you something amazing. Stay tuned!"
            />
            <div style={{ position: 'relative', zIndex: 10, marginTop: '-5rem', paddingBottom: '3rem' }}>
                <FeaturesComingSoon />
            </div>
        </div>
    );
}
