'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function HomeHero() {
  return (
    <section className="relative w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-10 md:py-20 overflow-hidden">
      {/* Decorative Wave */}
      <div className="absolute bottom-0 left-0 w-full h-24">
        <svg viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0 100C240 50 480 0 720 50C960 100 1200 50 1440 0V100H0Z"
            fill="white"
            fillOpacity="1"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-10 xl:px-0 w-full grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
        <motion.div
          className="flex flex-col justify-center gap-6 md:gap-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="font-bold text-[40px] leading-[48px] lg:text-[48px] lg:leading-[60px] xl:text-[58px] xl:leading-[74px] drop-shadow-lg">
            Host, Connect, Celebrate: Your Events, Our Platform!
          </h1>
          <p className="text-[18px] font-medium leading-[28px] md:text-[22px] md:leading-[32px] opacity-90">
            Discover and create unforgettable events with ease. Book mentors, share experiences, and celebrate together!
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              asChild
              className="bg-white text-cyan-600 rounded-full h-[54px] md:text-[20px] md:leading-[30px] w-full sm:w-fit shadow-lg hover:bg-gray-100"
            >
              <Link href="#events">Explore Now</Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        >
          <Image
            src="/assets/images/hero.png"
            alt="hero"
            width={1000}
            height={1000}
            className="max-h-[60vh] object-contain object-center md:max-h-[70vh] 2xl:max-h-[50vh] drop-shadow-xl"
            priority
          />
        </motion.div>
      </div>
    </section>
  );
}