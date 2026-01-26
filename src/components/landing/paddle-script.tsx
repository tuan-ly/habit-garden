'use client';

import { useEffect } from 'react';
import { getPaddleInstance } from '@/lib/paddle';

export function PaddleScript() {
    useEffect(() => {
        getPaddleInstance();
    }, []);

    return null;
}
