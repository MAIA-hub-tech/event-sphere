import CategoryFilter from '@/components/shared/CategoryFilter';
import Collection from '@/components/shared/Collection';
import Search from '@/components/shared/Search';
import { Button } from '@/components/ui/button';
import { getAllEvents } from '@/lib/actions/event.actions';
import { SearchParamProps } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

export default async function Home({ searchParams }: SearchParamProps) {
  try {
    const page = Number(searchParams?.page) || 1;
    const searchText = (searchParams?.query as string) || '';
    const category = (searchParams?.category as string) || '';

    const events = await getAllEvents({
      query: searchText,
      category,
      page,
      limit: 6
    });

    return (
      <>
        {/* Hero Section - Preserved from tutor's version */}
        <section className="bg-blue-50 bg-[radial-gradient(circle,theme(colors.gray.300)_1px,transparent_1px)] py-5 md:py-10">
          <div className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full grid grid-cols-1 gap-5 md:grid-cols-2 2xl:gap-0">
            <div className="flex flex-col justify-center gap-8">
              <h1 className="font-bold text-[40px] leading-[48px] lg:text-[48px] lg:leading-[60px] xl:text-[58px] xl:leading-[74px]">Host, Connect, Celebrate: Your Events, Our Platform!</h1>
              <p className="text-[20px] font-medium leading-[30px] md:font-normal md:text-[24px] md:leading-[36px]">
                Book and learn helpful tips from mentors in world-class companies.
              </p>
              <Button size="lg" asChild className="bg-cyan-500 rounded-full h-[54px] md:font-normal md:text-[24px] md:leading-[36px] w-full sm:w-fit">
                <Link href="#events">
                  Explore Now
                </Link>
              </Button>
            </div>

            <Image 
              src="/assets/images/hero.png"
              alt="hero"
              width={1000}
              height={1000}
              className="max-h-[70vh] object-contain object-center 2xl:max-h-[50vh]"
              priority
            />
          </div>
        </section>

        {/* Events Section - With your working Firebase setup */}
        <section id="events" className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full my-8 flex flex-col gap-8 md:gap-12">
          <h2 className=" font-bold text-[32px] leading-[40px] lg:text-[36px] lg:leading-[44px] xl:text-[40px] xl:leading-[48px]">Trusted by Thousands of Events</h2>

          <div className="flex w-full flex-col gap-5 md:flex-row">
            <Search />
            <CategoryFilter />
          </div>

          <Collection
            data={events.data}
            emptyTitle="No Events Found"
            emptyStateSubtext="Come back later"
            collectionType="All_Events"
            page={page}
            totalPages={events.totalPages}
            limit={6} // Now optional but can be passed
            urlParamName="page"
          />
        </section>
      </>
    );
  } catch (error) {
    console.error('Error loading home page:', error);
    return (
      <div className=" max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full my-8 flex flex-col items-center gap-8">
        <h2 className="font-bold text-[32px] leading-[40px] lg:text-[36px] lg:leading-[44px] xl:text-[40px] xl:leading-[48px]">Temporary Issue</h2>
        <p>We're having trouble loading events. Please try again shortly.</p>
        <Button asChild>
          <Link href="/">Refresh Page</Link>
        </Button>
      </div>
    );
  }
}