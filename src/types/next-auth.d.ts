import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role?: string;
            profileType?: string;
            rank?: number;
            rankTier?: string;
            followers?: string[];
            following?: string[];
        } & DefaultSession["user"];
    }

    interface User {
        role?: string;
        profileType?: string;
        rank?: number;
        rankTier?: string;
        followers?: string[];
        following?: string[];
    }
}
