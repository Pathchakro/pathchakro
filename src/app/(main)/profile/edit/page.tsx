'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { User, GraduationCap, Briefcase, Globe, Heart, ArrowLeft, MapPin, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
// import { bdLocations } from '@/lib/bd-locations';
// import { INTERESTS_LIST } from '@/lib/constants';
import { useDynamicConfig } from '@/hooks/useDynamicConfig';
import { InstituteSearch } from '@/components/profile/InstituteSearch';

export default function EditProfilePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Personal
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [image, setImage] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [isImageUploading, setIsImageUploading] = useState(false);

    const [title, setTitle] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [website, setWebsite] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [willingToDonateBlood, setWillingToDonateBlood] = useState(true);
    const [lastDateOfDonateBlood, setLastDateOfDonateBlood] = useState('');

    // Academic
    const [currentEducation, setCurrentEducation] = useState('');
    const [institution, setInstitution] = useState('');
    const [degree, setDegree] = useState('');
    const [fieldOfStudy, setFieldOfStudy] = useState('');
    const [graduationYear, setGraduationYear] = useState('');
    const [gpa, setGpa] = useState('');

    // Career
    const [currentPosition, setCurrentPosition] = useState('');
    const [company, setCompany] = useState('');
    const [industry, setIndustry] = useState('');
    const [yearsOfExperience, setYearsOfExperience] = useState('');
    const [skills, setSkills] = useState('');
    const [cvLink, setCvLink] = useState('');

    // Social
    const [linkedin, setLinkedin] = useState('');
    const [github, setGithub] = useState('');
    const [twitter, setTwitter] = useState('');
    const [facebook, setFacebook] = useState('');

    // Interests
    const [interests, setInterests] = useState<string[]>([]);


    // Address
    const [presentAddress, setPresentAddress] = useState({
        division: '',
        district: '',
        thana: '',
        addressLine: '',
        postCode: '',
        postOffice: '',
    });
    const [permanentAddress, setPermanentAddress] = useState({
        division: '',
        district: '',
        thana: '',
        addressLine: '',
        postCode: '',
        postOffice: '',
    });

    // Verification
    const [verificationFiles, setVerificationFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Fetch Profile Data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/profile/me');
                if (res.ok) {
                    const data = await res.json();
                    const user = data.user;

                    if (user) {
                        setName(user.name || '');
                        setEmail(user.email || '');
                        setImage(user.image || '');
                        setImagePreview(user.image || ''); // Set preview to existing image
                        setTitle(user.title || '');
                        setBio(user.bio || '');
                        setLocation(user.location || '');
                        setWebsite(user.social?.website || user.website || ''); // Handle both locations potentially
                        // Date might need formatting if IT comes as ISO string
                        if (user.dateOfBirth) {
                            setDateOfBirth(new Date(user.dateOfBirth).toISOString().split('T')[0]);
                        }
                        setPhone(user.phone || '');
                        setWhatsappNumber(user.whatsappNumber || '');
                        setBloodGroup(user.bloodGroup || '');
                        setWillingToDonateBlood(user.willingToDonateBlood !== undefined ? user.willingToDonateBlood : true);
                        if (user.lastDateOfDonateBlood) {
                            setLastDateOfDonateBlood(new Date(user.lastDateOfDonateBlood).toISOString().split('T')[0]);
                        }

                        // Populate other fields
                        if (user.academic) {
                            setCurrentEducation(user.academic.currentEducation || '');
                            setInstitution(user.academic.institution || '');
                            setDegree(user.academic.degree || '');
                            setFieldOfStudy(user.academic.fieldOfStudy || '');
                            setGraduationYear(user.academic.graduationYear?.toString() || '');
                            setGpa(user.academic.gpa?.toString() || '');
                        }

                        if (user.career) {
                            setCurrentPosition(user.career.currentPosition || '');
                            setCompany(user.career.company || '');
                            setIndustry(user.career.industry || '');
                            setYearsOfExperience(user.career.yearsOfExperience?.toString() || '');
                            setSkills(user.career.skills?.join(', ') || '');
                            setCvLink(user.career.cvLink || '');
                        }

                        if (user.social) {
                            setLinkedin(user.social.linkedin || '');
                            setGithub(user.social.github || '');
                            setTwitter(user.social.twitter || '');
                            setFacebook(user.social.facebook || '');
                        }

                        if (user.interests) setInterests(user.interests);

                        if (user.address?.present) {
                            setPresentAddress({
                                division: user.address.present.division || '',
                                district: user.address.present.district || '',
                                thana: user.address.present.thana || '',
                                addressLine: user.address.present.addressLine || '',
                                postCode: user.address.present.postCode || '',
                                postOffice: user.address.present.postOffice || '',
                            });
                        }
                        if (user.address?.permanent) {
                            setPermanentAddress({
                                division: user.address.permanent.division || '',
                                district: user.address.permanent.district || '',
                                thana: user.address.permanent.thana || '',
                                addressLine: user.address.permanent.addressLine || '',
                                postCode: user.address.permanent.postCode || '',
                                postOffice: user.address.permanent.postOffice || '',
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            }
        };
        fetchProfile();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Local preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to ImgBB
        setIsImageUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                setImage(data.displayUrl || data.url);
            } else {
                console.error('Upload failed', data.error);
                alert('Failed to upload image: ' + data.error);
            }
        } catch (error) {
            console.error('Error uploading image', error);
            alert('Error uploading image');
        } finally {
            setIsImageUploading(false);
        }
    };

    const handleAddressChange = (type: 'present' | 'permanent', field: string, value: string) => {
        if (type === 'present') {
            setPresentAddress(prev => {
                const updated = { ...prev, [field]: value };
                if (field === 'division') {
                    updated.district = '';
                    updated.thana = '';
                } else if (field === 'district') {
                    updated.thana = '';
                }
                return updated;
            });
        } else {
            setPermanentAddress(prev => {
                const updated = { ...prev, [field]: value };
                if (field === 'division') {
                    updated.district = '';
                    updated.thana = '';
                } else if (field === 'district') {
                    updated.thana = '';
                }
                return updated;
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setVerificationFiles(prev => [...prev, ...filesArray]);
        }
    };

    const removeFile = (index: number) => {
        setVerificationFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');

        try {
            const uploadedUrls: string[] = [];

            if (verificationFiles.length > 0) {
                setIsUploading(true);
                // Upload files sequentially or in parallel
                for (const file of verificationFiles) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const uploadResponse = await fetch('/api/upload/image', {
                        method: 'POST',
                        body: formData,
                    });
                    const uploadResult = await uploadResponse.json();
                    if (!uploadResponse.ok) throw new Error(uploadResult.error || 'Failed to upload one or more verification documents');
                    uploadedUrls.push(uploadResult.displayUrl || uploadResult.url);
                }
                setIsUploading(false);
            }

            const response = await fetch('/api/profile/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    image,
                    title,
                    bio,
                    location,
                    website,
                    dateOfBirth,
                    phone,
                    whatsappNumber,
                    bloodGroup,
                    willingToDonateBlood,
                    lastDateOfDonateBlood,
                    currentEducation,
                    institution,
                    degree,
                    fieldOfStudy,
                    graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
                    gpa: gpa ? parseFloat(gpa) : undefined,
                    currentPosition,
                    company,
                    industry,
                    yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : undefined,
                    skills: skills ? skills.split(',').map(s => s.trim()) : [],
                    cvLink,
                    linkedin,
                    github,
                    twitter,
                    facebook,
                    interests,
                    presentAddress,
                    permanentAddress,
                    verificationDocuments: uploadedUrls.length > 0 ? uploadedUrls : undefined,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Profile updated successfully!');
                router.push('/profile/me');
            } else {
                setError(data.error || 'Failed to update profile');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
            setIsUploading(false);
        }
    };

    const calculateCompletion = () => {
        const fields = [
            title, bio, location, phone,
            currentEducation, institution,
            currentPosition, company,
            presentAddress.addressLine, permanentAddress.addressLine,
            interests.length > 0 ? 'filled' : '',
            // Add more weights as needed
        ];
        const filled = fields.filter(f => f && f.length > 0).length;
        // Adjusted calculation
        return Math.round((filled / 11) * 100);
    };
    const completionPercentage = calculateCompletion();

    // Dynamic Config
    const { categories: dynamicInterests, locations: dynamicLocations, loading: configLoading } = useDynamicConfig();

    // Helpers to get districts and thanas based on selection
    const getDistricts = (divisionName: string) => {
        const division = dynamicLocations.find(d => d.division === divisionName);
        return division ? division.districts : [];
    };

    const getThanas = (divisionName: string, districtName: string) => {
        const districts = getDistricts(divisionName);
        const district = districts.find(d => d.name === districtName);
        return district ? district.thanas : [];
    };

    const toggleInterest = (interest: string) => {
        setInterests(prev => {
            if (prev.includes(interest)) {
                return prev.filter(i => i !== interest);
            } else {
                if (prev.length >= 3) return prev;
                return [...prev, interest];
            }
        });
    };

    // Use dynamic locations for mapping options
    const divisions = dynamicLocations;

    if (configLoading) {
        return <div className="p-8 text-center"><p>Loading configuration...</p></div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <Link href="/profile/me" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Profile
            </Link>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">Edit Profile</CardTitle>
                            <CardDescription>
                                Update your complete profile information
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium mb-1">
                                Profile Completion: <span className={completionPercentage >= 70 ? "text-green-600" : "text-amber-600"}>{completionPercentage}%</span>
                            </div>
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${completionPercentage >= 70 ? "bg-green-500" : "bg-amber-500"} transition-all duration-500`}
                                    style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                                />
                            </div>
                            {completionPercentage < 70 && (
                                <p className="text-xs text-red-500 mt-1">Complete 70% to unlock posting</p>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {error && (
                        <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <Tabs defaultValue="personal" className="w-full">
                        <TabsList className="grid w-full grid-cols-7">
                            <TabsTrigger value="personal"><User className="h-4 w-4 mr-2" />Personal</TabsTrigger>
                            <TabsTrigger value="address"><MapPin className="h-4 w-4 mr-2" />Address</TabsTrigger>
                            <TabsTrigger value="academic"><GraduationCap className="h-4 w-4 mr-2" />Academic</TabsTrigger>
                            <TabsTrigger value="career"><Briefcase className="h-4 w-4 mr-2" />Career</TabsTrigger>
                            <TabsTrigger value="social"><Globe className="h-4 w-4 mr-2" />Social</TabsTrigger>
                            <TabsTrigger value="interests"><Heart className="h-4 w-4 mr-2" />Interests</TabsTrigger>
                            <TabsTrigger value="verification"><ShieldCheck className="h-4 w-4 mr-2" />Verify</TabsTrigger>
                        </TabsList>

                        {/* Personal Tab */}
                        <TabsContent value="personal" className="space-y-4">
                            {/* Profile Image & Name */}
                            <div className="flex flex-col items-center sm:flex-row gap-6 mb-6">
                                <div className="relative group">
                                    <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center">
                                        {imagePreview || image ? (
                                            <img src={imagePreview || image} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-12 w-12 text-muted-foreground" />
                                        )}
                                    </div>
                                    <label htmlFor="profile-image" className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full cursor-pointer hover:bg-primary/90 shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                        <input
                                            type="file"
                                            id="profile-image"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={isImageUploading}
                                        />
                                    </label>
                                    {isImageUploading && (
                                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-full">
                                            <span className="text-xs font-medium">Uploading...</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 w-full">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your Full Name"
                                        className="mt-1.5"
                                    />
                                    <div className="mt-3">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            value={email}
                                            disabled
                                            className="mt-1.5 bg-muted"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="title">Professional Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Doctor, Teacher, Freelancer, Business Owner"
                                />
                            </div>
                            <div>
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    rows={4}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Dhaka, Bangladesh"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                    <Input
                                        id="dateOfBirth"
                                        type="date"
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+880 1XXXXXXXXX"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                                    <Input
                                        id="whatsappNumber"
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        placeholder="+880 1XXXXXXXXX"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="bloodGroup">Blood Group</Label>
                                    <select
                                        id="bloodGroup"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={bloodGroup}
                                        onChange={(e) => setBloodGroup(e.target.value)}
                                    >
                                        <option value="">Select Blood Group</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                                <div className="flex items-center space-x-2 pt-8">
                                    <input
                                        type="checkbox"
                                        id="willingToDonateBlood"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={willingToDonateBlood}
                                        onChange={(e) => setWillingToDonateBlood(e.target.checked)}
                                    />
                                    <Label htmlFor="willingToDonateBlood">Willing to donate blood</Label>
                                </div>
                                <div>
                                    <Label htmlFor="lastDateOfDonateBlood">Last Donation Date</Label>
                                    <Input
                                        id="lastDateOfDonateBlood"
                                        type="date"
                                        value={lastDateOfDonateBlood}
                                        onChange={(e) => setLastDateOfDonateBlood(e.target.value)}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Address Tab */}
                        <TabsContent value="address" className="space-y-6">
                            <div className="space-y-4 border p-4 rounded-md">
                                <h3 className="font-semibold text-lg">Present Address</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="presentDivision">Division</Label>
                                        <select
                                            id="presentDivision"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={presentAddress.division}
                                            onChange={(e) => handleAddressChange('present', 'division', e.target.value)}
                                        >
                                            <option value="">Select Division</option>
                                            {divisions.map(div => (
                                                <option key={div.division} value={div.division}>{div.division}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="presentDistrict">District</Label>
                                        <select
                                            id="presentDistrict"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={presentAddress.district}
                                            onChange={(e) => handleAddressChange('present', 'district', e.target.value)}
                                            disabled={!presentAddress.division}
                                        >
                                            <option value="">Select District</option>
                                            {getDistricts(presentAddress.division).map(dist => (
                                                <option key={dist.name} value={dist.name}>{dist.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="presentThana">Thana/Upazila</Label>
                                        <select
                                            id="presentThana"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={presentAddress.thana}
                                            onChange={(e) => handleAddressChange('present', 'thana', e.target.value)}
                                            disabled={!presentAddress.district}
                                        >
                                            <option value="">Select Thana</option>
                                            {getThanas(presentAddress.division, presentAddress.district).map(thana => (
                                                <option key={thana} value={thana}>{thana}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="presentPostOffice">Post Office</Label>
                                        <Input
                                            id="presentPostOffice"
                                            value={presentAddress.postOffice}
                                            onChange={(e) => handleAddressChange('present', 'postOffice', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="presentPostCode">Post Code</Label>
                                        <Input
                                            id="presentPostCode"
                                            value={presentAddress.postCode}
                                            onChange={(e) => handleAddressChange('present', 'postCode', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="presentAddressLine">Address Line (Village, House, Road)</Label>
                                    <Input
                                        id="presentAddressLine"
                                        value={presentAddress.addressLine}
                                        onChange={(e) => handleAddressChange('present', 'addressLine', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 border p-4 rounded-md">
                                <h3 className="font-semibold text-lg">Permanent Address</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="permanentDivision">Division</Label>
                                        <select
                                            id="permanentDivision"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={permanentAddress.division}
                                            onChange={(e) => handleAddressChange('permanent', 'division', e.target.value)}
                                        >
                                            <option value="">Select Division</option>
                                            {divisions.map(div => (
                                                <option key={div.division} value={div.division}>{div.division}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="permanentDistrict">District</Label>
                                        <select
                                            id="permanentDistrict"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={permanentAddress.district}
                                            onChange={(e) => handleAddressChange('permanent', 'district', e.target.value)}
                                            disabled={!permanentAddress.division}
                                        >
                                            <option value="">Select District</option>
                                            {getDistricts(permanentAddress.division).map(dist => (
                                                <option key={dist.name} value={dist.name}>{dist.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="permanentThana">Thana/Upazila</Label>
                                        <select
                                            id="permanentThana"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={permanentAddress.thana}
                                            onChange={(e) => handleAddressChange('permanent', 'thana', e.target.value)}
                                            disabled={!permanentAddress.district}
                                        >
                                            <option value="">Select Thana</option>
                                            {getThanas(permanentAddress.division, permanentAddress.district).map(thana => (
                                                <option key={thana} value={thana}>{thana}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="permanentPostOffice">Post Office</Label>
                                        <Input
                                            id="permanentPostOffice"
                                            value={permanentAddress.postOffice}
                                            onChange={(e) => handleAddressChange('permanent', 'postOffice', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="permanentPostCode">Post Code</Label>
                                        <Input
                                            id="permanentPostCode"
                                            value={permanentAddress.postCode}
                                            onChange={(e) => handleAddressChange('permanent', 'postCode', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="permanentAddressLine">Address Line (Village, House, Road)</Label>
                                    <Input
                                        id="permanentAddressLine"
                                        value={permanentAddress.addressLine}
                                        onChange={(e) => handleAddressChange('permanent', 'addressLine', e.target.value)}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Academic Tab */}
                        <TabsContent value="academic" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="currentEducation">Highest Education Level</Label>
                                    <select
                                        id="currentEducation"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={currentEducation}
                                        onChange={(e) => setCurrentEducation(e.target.value)}
                                    >
                                        <option value="">Select One</option>
                                        <option value="JSC/JDC/8 pass">JSC/JDC/8 pass</option>
                                        <option value="Secondary">Secondary</option>
                                        <option value="Higher Secondary">Higher Secondary</option>
                                        <option value="Diploma">Diploma</option>
                                        <option value="Bachelor/Honors">Bachelor/Honors</option>
                                        <option value="Masters">Masters</option>
                                        <option value="PhD (Doctor of Philosophy)">PhD (Doctor of Philosophy)</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="degree">Degree</Label>
                                    <Input
                                        id="degree"
                                        value={degree}
                                        onChange={(e) => setDegree(e.target.value)}
                                        placeholder="BSc, MSc, PhD"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="institution">Institution</Label>
                                <InstituteSearch
                                    value={institution}
                                    onSelect={(val) => setInstitution(val)}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="fieldOfStudy">Field of Study</Label>
                                    <Input
                                        id="fieldOfStudy"
                                        value={fieldOfStudy}
                                        onChange={(e) => setFieldOfStudy(e.target.value)}
                                        placeholder="Computer Science"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="graduationYear">Graduation Year</Label>
                                    <Input
                                        id="graduationYear"
                                        type="number"
                                        value={graduationYear}
                                        onChange={(e) => setGraduationYear(e.target.value)}
                                        placeholder="2025"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="gpa">GPA/CGPA</Label>
                                    <Input
                                        id="gpa"
                                        type="number"
                                        step="0.01"
                                        value={gpa}
                                        onChange={(e) => setGpa(e.target.value)}
                                        placeholder="3.75"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Career Tab */}
                        <TabsContent value="career" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="currentPosition">Current Position</Label>
                                    <Input
                                        id="currentPosition"
                                        value={currentPosition}
                                        onChange={(e) => setCurrentPosition(e.target.value)}
                                        placeholder="Software Engineer"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="company">Company</Label>
                                    <Input
                                        id="company"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        placeholder="Tech Company Ltd."
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="industry">Industry</Label>
                                    <Input
                                        id="industry"
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                        placeholder="Technology, Education, etc."
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                                    <Input
                                        id="yearsOfExperience"
                                        type="number"
                                        value={yearsOfExperience}
                                        onChange={(e) => setYearsOfExperience(e.target.value)}
                                        placeholder="3"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="skills">Skills (comma separated)</Label>
                                <Textarea
                                    id="skills"
                                    value={skills}
                                    onChange={(e) => setSkills(e.target.value)}
                                    placeholder="JavaScript, Python, React, Node.js"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label htmlFor="cvLink">CV (PDF Google Drive URL Link)</Label>
                                <Input
                                    id="cvLink"
                                    value={cvLink}
                                    onChange={(e) => setCvLink(e.target.value)}
                                    placeholder="https://drive.google.com/file/d/..."
                                />
                            </div>
                        </TabsContent>

                        {/* Social Tab */}
                        <TabsContent value="social" className="space-y-4">
                            <div>
                                <Label htmlFor="linkedin">LinkedIn Profile</Label>
                                <Input
                                    id="linkedin"
                                    value={linkedin}
                                    onChange={(e) => setLinkedin(e.target.value)}
                                    placeholder="https://linkedin.com/in/username"
                                />
                            </div>
                            <div>
                                <Label htmlFor="github">GitHub Profile</Label>
                                <Input
                                    id="github"
                                    value={github}
                                    onChange={(e) => setGithub(e.target.value)}
                                    placeholder="https://github.com/username"
                                />
                            </div>
                            <div>
                                <Label htmlFor="twitter">Twitter/X Profile</Label>
                                <Input
                                    id="twitter"
                                    value={twitter}
                                    onChange={(e) => setTwitter(e.target.value)}
                                    placeholder="https://twitter.com/username"
                                />
                            </div>
                            <div>
                                <Label htmlFor="facebook">Facebook Profile</Label>
                                <Input
                                    id="facebook"
                                    value={facebook}
                                    onChange={(e) => setFacebook(e.target.value)}
                                    placeholder="https://facebook.com/username"
                                />
                            </div>
                            <div>
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://example.com"
                                />
                            </div>
                        </TabsContent>

                        {/* Interests Tab */}
                        <TabsContent value="interests" className="space-y-4">
                            <div>
                                <Label className="mb-2 block">Interests (Select up to 3)</Label>
                                <div className="flex flex-wrap gap-2">
                                    {dynamicInterests.map((interest) => (
                                        <Button
                                            key={interest}
                                            type="button"
                                            variant={interests.includes(interest) ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => toggleInterest(interest)}
                                            disabled={!interests.includes(interest) && interests.length >= 3}
                                            className="rounded-full"
                                        >
                                            {interest}
                                        </Button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Selected: {interests.length}/3
                                </p>
                            </div>
                        </TabsContent>

                        {/* Verification Tab */}
                        <TabsContent value="verification" className="space-y-4">
                            <div>
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium mb-2">Upload Verification Documents</h3>
                                    <p className="text-sm text-gray-500 mb-4">Please upload images of your ID card, Student ID, or any other relevant documents.</p>

                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="file"
                                            id="verification-file"
                                            className="hidden"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById('verification-file')?.click()}
                                        >
                                            Select Images
                                        </Button>
                                        <span className="text-sm text-gray-500">{verificationFiles.length} file(s) selected</span>
                                    </div>
                                </div>

                                {verificationFiles.length > 0 && (
                                    <div className="space-y-2">
                                        {verificationFiles.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 border rounded bg-gray-50">
                                                <span className="text-sm truncate max-w-[80%]">{file.name}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                                    onClick={() => removeFile(index)}
                                                >
                                                    <span className="sr-only">Remove</span>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex gap-3 mt-6">
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading ? 'Saving...' : 'Save Profile'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
