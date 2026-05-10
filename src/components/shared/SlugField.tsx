'use client';

import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { slugify } from '@/lib/utils';

interface SlugFieldProps {
    form: UseFormReturn<any>;
    watchField: string;
    label?: string;
    placeholder?: string;
    description?: string;
    disabled?: boolean;
    mode?: 'create' | 'edit';
    initialValue?: string;
}

export function SlugField({
    form,
    watchField,
    label = "Custom URL Slug (Optional)",
    placeholder = "e.g. custom-url-path",
    description = "If left empty, a URL will be automatically generated from the title.",
    disabled = false,
    mode = 'create',
    initialValue = ''
}: SlugFieldProps) {
    const { register, watch, setValue, formState: { errors } } = form;
    const [isModified, setIsModified] = useState(mode === 'edit' && !!initialValue);
    const watchValue = watch(watchField);

    useEffect(() => {
        if (initialValue) {
            setValue('slug', initialValue, { shouldValidate: true });
            setIsModified(mode === 'edit' && !!initialValue);
        }
    }, [initialValue, setValue, mode]);

    useEffect(() => {
        if (mode === 'create' && !isModified && watchValue) {
            setValue('slug', slugify(watchValue), { shouldValidate: true });
        }
    }, [watchValue, mode, isModified, setValue]);

    return (
        <div className="space-y-2">
            <Label htmlFor="slug">{label}</Label>
            <Input
                id="slug"
                placeholder={placeholder}
                {...register('slug', {
                    onChange: () => setIsModified(true)
                })}
                disabled={disabled}
            />
            {description && (
                <p className="text-xs text-muted-foreground">
                    {description}
                </p>
            )}
            {errors.slug && (
                <p className="text-sm text-red-500">{(errors.slug as any).message}</p>
            )}
        </div>
    );
}
