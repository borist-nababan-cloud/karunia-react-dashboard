import { useLocation, useSearchParams as useRouterSearchParams, useParams as useRouterParams } from 'react-router-dom';

export function usePathname() {
    const { pathname } = useLocation();
    return pathname;
}

export function useSearchParams() {
    const [searchParams] = useRouterSearchParams();
    return searchParams;
}

export function useParams() {
    return useRouterParams();
}
