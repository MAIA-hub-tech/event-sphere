import { getAllEvents } from '@/lib/actions/event.actions';
import Collection from '@/components/shared/Collection';
import Search from '@/components/shared/Search';
import CategoryFilter from '@/components/shared/CategoryFilter';
import HomeHero from '@/components/shared/HomeHero';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams; // Await the searchParams prop
  const page = typeof resolvedSearchParams.page === 'string' ? Number(resolvedSearchParams.page) : 1;
  const searchText = typeof resolvedSearchParams.query === 'string' ? resolvedSearchParams.query : '';
  const category = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : '';

  const events = await getAllEvents({
    query: searchText,
    category,
    page,
    limit: 6,
  });

  return (
    <>
      {/* Hero Section - Moved to Client Component */}
      <HomeHero />

      {/* Events Section */}
      <section id="events" className="max-w-7xl mx-auto px-5 md:px-10 xl:px-0 w-full my-12 flex flex-col gap-8 md:gap-12">
        <h2 className="font-bold text-[32px] leading-[40px] lg:text-[36px] lg:leading-[44px] xl:text-[40px] xl:leading-[48px] text-gray-800">
          Trusted by Thousands of Events
        </h2>

        <div className="flex w-full flex-col gap-5 md:flex-row">
          <Search />
          <CategoryFilter />
        </div>

        <Collection
          data={events.data}
          emptyTitle="No Events Found"
          emptyStateSubtext="Come back later to see new events!"
          collectionType="All_Events"
          page={page}
          totalPages={events.totalPages}
          limit={6}
          urlParamName="page"
        />
      </section>
    </>
  );
}