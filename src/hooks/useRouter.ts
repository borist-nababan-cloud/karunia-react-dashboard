import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

export function useRouter() {
    const navigate = useNavigate();

    return useMemo(() => ({
        push: (path: string) => navigate(path),
        replace: (path: string) => navigate(path, { replace: true }),
        back: () => navigate(-1),
        forward: () => navigate(1),
        refresh: () => window.location.reload(),
        prefetch: () => { },
    }), [navigate]);
}
