'use client';

import { useState, useEffect } from 'react';

// Types
interface Category {
    _id: string;
    name: string;
    slug: string;
}

interface Location {
    _id: string;
    division: string;
    districts: {
        name: string;
        thanas: string[];
    }[];
}

export function useDynamicConfig() {
    const [categories, setCategories] = useState<string[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch in parallel
                const [catRes, locRes] = await Promise.all([
                    fetch('/api/categories'),
                    fetch('/api/locations')
                ]);

                const catData = await catRes.json();
                const locData = await locRes.json();

                if (catData.categories) {
                    setCategories(catData.categories.map((c: Category) => c.name));
                }

                if (locData.locations) {
                    setLocations(locData.locations);
                }
            } catch (error) {
                console.error('Failed to load dynamic config:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { categories, locations, loading };
}
