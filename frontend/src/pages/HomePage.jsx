import React, { useEffect, useState } from 'react'
import '../styles/home.css'
import heroPhoto1 from "../assets/home_page/hero_photo1.jpg";
import heroPhoto2 from "../assets/home_page/hero_photo2.jpg";
import heroVideo from "../assets/home_page/hero_video.mp4";
import { useSelector } from 'react-redux';
import RouteCard from '../components/RouteCard';
import { Link } from 'react-router-dom';
import FooterBanner from '../components/FooterBanner';
import RouteCardSkeleton from '../components/RouteCardSkeleton';
import { motion } from 'framer-motion';
import { Globe } from '@/components/ui/globe';
import { AuroraText } from '@/components/ui/aurora-text';
import { BlurFade } from '@/components/ui/blur-fade';
import { NumberTicker } from '@/components/ui/number-ticker';
import { ShinyButton } from '@/components/ui/shiny-button';
import { PixelImage } from '@/components/ui/pixel-image';
import { ArrowRightIcon } from 'lucide-react';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { cn } from '@/lib/utils';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { TypingAnimation } from '@/components/ui/typing-animation';
import { SparklesText } from '@/components/ui/sparkles-text';

const stats = [
  { id: 1, name: 'We help every year', value: '500', suffix: ' users', prefix: '>' },
  { id: 2, name: 'Satisfaction rate from users', value: '98.5', suffix: '%', prefix: '🌟' },
  { id: 3, name: 'New users annually', value: '100', suffix: ' accounts', prefix: '>' },
]

const useCounter = (end, duration = 2000, trigger = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const currentCount = Math.floor(progress * end);
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, trigger]);

  return count;
};

// Random hex color generator
const generateRandomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

export default function HomePage() {
  const { currentUser } = useSelector((state) => state.user);
  const [recentRoutes, setRecentRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [img1Loaded, setImg1Loaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [img2Loaded, setImg2Loaded] = useState(false);

  // Random colors for gradient backgrounds
  const [gradientColors, setGradientColors] = useState(() => ({
    gradient1: { from: generateRandomColor(), to: generateRandomColor() },
    gradient2: { from: generateRandomColor(), to: generateRandomColor() },
    gradient3: { from: generateRandomColor(), to: generateRandomColor() },
  }));

  useEffect(() => {
    try {
      const fetchRecentRoutes = async () => {
        const res = await fetch(`/api/routes?limit=3&order=desc`);
        const data = await res.json();
        if (res.ok) {
          setLoading(false);
          setRecentRoutes(data.routes);
        }
      };
      fetchRecentRoutes();
    } catch (error) {
      setLoading(true);
      console.log(error.message);
    }
  }, []);

  return (
    <div>
      <section className='flex flex-col lg:flex-row transition-all duration-500'>
        <div className="relative isolate px-6 lg:px-8 flex-1">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-0"
          >
            <div
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                background: `linear-gradient(to top right, ${gradientColors.gradient1.from}, ${gradientColors.gradient1.to})`,
              }}
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-[pulse_7s_ease-in-out_infinite]"
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 -z-50 transform-gpu overflow-hidden blur-3xl sm:-top-0 translate-y-[1000px] lg:translate-x-[250px] rotate-180"
          >
            <div
              style={{
                clipPath:
                  'polygon(90% 10%, 100% 20%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 1% 100%, 76.1% 97.7%, 85% 110%, 90% 125%, 95% 140%, 98% 155%, 100% 170%, 200% 200%)',
                background: `linear-gradient(to top right, ${gradientColors.gradient2.from}, ${gradientColors.gradient2.to})`,
              }}
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-[pulse_6s_ease-in-out_infinite]"
            />
          </div>

          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 mb-10">
            <div className="text-center">
              <BlurFade delay={0.25} inView>
                <h1 className="text-balance text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-7xl">
                  <TypingAnimation
                    words={["Craft", "Arrange", "Explore"]}
                    blinkCursor={true}
                    pauseDelay={3000}
                    loop
                    className="mr-4"
                    showCursor={false}
                  ></TypingAnimation>
                  <AuroraText> routes </AuroraText>
                  <br /> worth discover'
                </h1>
              </BlurFade>
              <BlurFade delay={0.25 * 2} inView>
                <p className="mt-8 text-pretty text-lg font-medium text-gray-500 dark:text-gray-400 sm:text-xl/8">
                  Map your perfect itinerary, publish it for the community, and fork routes from fellow explorers. <span className='text-2xl'>🧭</span>
                </p>
              </BlurFade>
              <BlurFade delay={0.25 * 3} inView>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link to='/explore'>
                    <RainbowButton className='h-12'>Explore public routes</RainbowButton>
                  </Link>
                  <div className="z-10 flex items-center justify-center">
                    <Link to={currentUser ? "/dashboard?tab=profile" : "/sign-in"}>
                      <div
                        className={cn(
                          "group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        )}
                      >
                        <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                          <span>✨ {currentUser ? "Go to profile" : "Sign in"}</span>
                          <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                        </AnimatedShinyText>
                      </div>
                    </Link>
                  </div>
                  {/*                   <a href={currentUser ? "/dashboard?tab=profile" : "/sign-in"} className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-200" >
                    {currentUser ? "Go to profile" : "Sign in"} <span aria-hidden="true">→</span>
                  </a>
 */}                </div>
              </BlurFade>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[calc(100%-20rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-10"
          >
            <div
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                background: `linear-gradient(to top right, ${gradientColors.gradient3.from}, ${gradientColors.gradient3.to})`,
              }}
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] animate-[pulse_7s_ease-in-out_infinite]"
            />
          </div>
        </div>

        <div className='flex-1 m-auto'>
          <div className='flex flex-row gap-3 px-3 sm:px-10 md:px-20 lg:pr-16 lg:pl-10 xl:pr-24 2xl:pr-44 md:flex-row items-center justify-center transition-all duration-500'>
            <BlurFade delay={0.25 * 2} inView>
              <div className='hero__box mb-10 relative'>
                <img
                  src={heroPhoto1}
                  alt=""
                  onLoad={() => setImg1Loaded(true)}
                  className={`transition-opacity duration-700 ${img1Loaded ? 'opacity-100' : 'opacity-0'}`}
                />
              </div>
            </BlurFade>
            <BlurFade delay={0.25 * 3} inView>
              <div className='hero__box mb-20 relative'>
                <video
                  src={heroVideo}
                  autoPlay
                  loop
                  muted
                  onCanPlayThrough={() => setVideoLoaded(true)}
                  className={`transition-opacity duration-700 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
              </div>
            </BlurFade>
            <BlurFade delay={0.25} inView>
              <div className='hero__box relative'>
                <img
                  src={heroPhoto2}
                  alt=""
                  onLoad={() => setImg2Loaded(true)}
                  className={`transition-opacity duration-700 ${img2Loaded ? 'opacity-100' : 'opacity-0'}`}
                />
              </div>
            </BlurFade>
          </div>
        </div>
      </section >

      <motion.section
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="pt-2 pb-16 sm:pb-20 sm:pt-2">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.dl
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 gap-x-8 gap-y-12 text-center lg:grid-cols-3"
            >
              {stats.map((stat, index) => {
                const [isVisible, setIsVisible] = useState(false);
                const count = useCounter(parseFloat(stat.value), 2000, isVisible);

                return (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    onViewportEnter={() => setIsVisible(true)}
                    className="mx-auto flex max-w-xs flex-col gap-y-2 z-10"
                  >
                    <motion.dt
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="text-lg text-gray-500 dark:text-gray-400"
                    >
                      {stat.name}
                    </motion.dt>
                    <motion.dd
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="order-first text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl flex flex-row items-center justify-center gap-2"
                    >
                      {stat.prefix && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                          className="text-3xl font-extralight text-gray-500 dark:text-gray-400"
                        >
                          {stat.prefix}
                        </motion.span>
                      )}
                      <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                      >
                        {/* {stat.value.includes('.') ? count.toFixed(0) : count} */}
                        <NumberTicker
                          value={count}
                          className=" tracking-tighter whitespace-pre-wrap text-black dark:text-white"
                        />
                        {stat.suffix}
                      </motion.span>
                    </motion.dd>
                  </motion.div>
                );
              })}
            </motion.dl>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='mt-0 sm:mt-10'
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className='text-center mt-5 z-50 relative'
        >
          <SparklesText sparklesCount={6} className='text-4xl sm:text-5xl font-semibold text-gray-900 dark:text-gray-100' >
            Freshly Shared Routes
          </SparklesText>
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className='flex flex-wrap gap-5 m-5 justify-center'
        >
          {loading || recentRoutes.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={`route-skeleton-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full sm:w-[430px]"
              >
                <RouteCardSkeleton />
              </motion.div>
            ))
            : recentRoutes.map((route) => (
              <motion.div
                key={route._id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full sm:w-[430px]"
              >
                <RouteCard route={route} />
              </motion.div>
            ))
          }
        </motion.div>
      </motion.section>

      <section>
        <div>
          <FooterBanner />
        </div>
      </section>
    </div >
  )
}