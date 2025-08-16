import { Metadata } from 'next';
import { Suspense } from 'react';
import { ProviderDirectoryClient } from './provider-directory-client';
import { ProviderDirectorySkeleton } from './loading';
import { generateProviderDirectoryMetadata } from './metadata';

// Dynamic metadata generation based on search params
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  // Convert searchParams to a simpler format
  const params = Object.entries(searchParams).reduce((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = value;
    } else if (Array.isArray(value)) {
      acc[key] = value[0];
    }
    return acc;
  }, {} as Record<string, string>);

  return generateProviderDirectoryMetadata({ searchParams: params });
}

interface ProviderDirectoryPageProps {
  searchParams: {
    search?: string;
    expertise?: string;
    location?: string;
    certification?: string;
    industry?: string;
    companySize?: string;
    rating?: string;
    verified?: string;
    pricing?: string;
    sort?: string;
    page?: string;
    limit?: string;
  };
}

export default function ProviderDirectoryPage({ searchParams }: ProviderDirectoryPageProps) {
  return (
    <Suspense fallback={<ProviderDirectorySkeleton />}>
      <ProviderDirectoryClient initialFilters={searchParams} />
    </Suspense>
  );
}