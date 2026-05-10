import { getCachedBloodDonors } from '@/lib/data/blood-donors';
import BloodDonorsClient from '@/components/blood/BloodDonorsClient';

export const metadata = {
    title: 'Find Blood Donors - Pathchakro',
    description: 'Search for blood donors by location and blood group within the Pathchakro community.',
};

export default async function BloodDonorsPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const bloodGroup = typeof searchParams.bloodGroup === 'string' ? searchParams.bloodGroup : undefined;
    const location = typeof searchParams.location === 'string' ? searchParams.location : undefined;

    let donors = [];
    try {
        // Fetch blood donors with caching and error safety
        donors = await getCachedBloodDonors({
            bloodGroup,
            location
        });
    } catch (error) {
        console.error('Error in BloodDonorsPage:', error);
        // We return a fallback UI here if the database call fails catastrophically
        return (
            <div className="container py-24 text-center space-y-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight">Database Connectivity Issue</h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                    We're having trouble retrieving the donor list right now. 
                    Please check your connection and try again in a few moments.
                </p>
            </div>
        );
    }

    return <BloodDonorsClient initialDonors={donors} />;
}
