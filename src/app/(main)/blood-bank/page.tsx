import { getCachedDonors } from '@/lib/data/blood-bank';
import BloodBankClient from '@/components/blood/BloodBankClient';
import { auth } from '@/auth';

export const metadata = {
    title: 'Blood Bank - Pathchakro',
    description: 'Find willing blood donors in your area and help save lives.',
};

export default async function BloodBankPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const session = await auth();
    const isAuthenticated = !!session?.user;

    const bloodGroup = typeof searchParams.bloodGroup === 'string' ? searchParams.bloodGroup : undefined;
    const district = typeof searchParams.district === 'string' ? searchParams.district : undefined;
    const thana = typeof searchParams.thana === 'string' ? searchParams.thana : undefined;

    // Direct database call with unstable_cache
    const donors = await getCachedDonors({
        bloodGroup,
        district,
        thana
    }, isAuthenticated);

    return <BloodBankClient initialDonors={donors} />;
}
