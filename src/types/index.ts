export interface IUser {
    _id: string;
    name: string;
    email: string;
    password?: string;
    image?: string;
    coverImage?: string;
    // Personal
    title?: string;
    bio?: string;
    location?: string;
    website?: string;
    dateOfBirth?: Date;
    phone?: string;

    // Academic (Detailed)
    academic?: {
        currentEducation?: string;
        institution?: string;
        degree?: string;
        fieldOfStudy?: string;
        graduationYear?: number;
        gpa?: number;
    };

    // Career
    career?: {
        currentPosition?: string;
        company?: string;
        industry?: string;
        yearsOfExperience?: number;
        skills?: string[];
    };

    // Social
    social?: {
        linkedin?: string;
        github?: string;
        twitter?: string;
    };

    // Interests & Languages
    interests?: string[];
    languages?: string[];

    // Address
    address?: {
        present?: {
            division?: string;
            addressLine?: string;
            postCode?: string;
            thana?: string;
            postOffice?: string;
            district?: string;
        };
        permanent?: {
            division?: string;
            addressLine?: string;
            postCode?: string;
            thana?: string;
            postOffice?: string;
            district?: string;
        };
    };

    // Verification
    verification?: {
        isVerified: boolean;
        documentUrl?: string;
        status: 'pending' | 'approved' | 'rejected' | 'none';
        submittedAt?: Date;
    };

    // Existing fields
    profileType: 'Student' | 'Tutor' | 'Regular';
    university?: string; // Legacy? Keep for compatibility
    thana?: string; // Legacy? 
    bloodGroup?: string;
    bookPreferences?: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IPost {
    _id: string;
    author: string | IUser;
    content: string;
    type: 'text' | 'photo' | 'video' | 'review' | 'quiz' | 'assignment' | 'poll';
    media?: string[];
    privacy: 'public' | 'friends' | 'team';
    likes: string[];
    comments: string[];
    shares: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBook {
    _id: string;
    title: string;
    author: string;
    slug: string;
    publisher?: string;
    isbn?: string;
    category: string[];
    coverImage?: string;
    pdfUrl?: string; // Optional PDF link
    averageRating: number;
    totalReviews: number;
    copies: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IReview {
    _id: string;
    book: string | IBook;
    user: string | IUser;
    rating: number;
    content: string;
    tags?: string[];
    videoUrl?: string;
    helpful: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITeam {
    _id: string;
    name: string;
    description: string;
    type: 'University' | 'Thana' | 'Special';
    category: string;
    privacy: 'public' | 'private';
    coverImage?: string;
    logo?: string;
    leader: string | IUser;
    members: Array<{
        user: string | IUser;
        role: 'leader' | 'deputy' | 'member';
        joinedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

export interface IComment {
    _id: string;
    post: string | IPost;
    author: string | IUser;
    content: string;
    replies?: IComment[];
    likes: string[];
    createdAt: Date;
}
