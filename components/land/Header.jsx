"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, useRef } from "react";
import {
  useMotionValueEvent,
  motion,
  useScroll,
  AnimatePresence,
} from "motion/react";

export default function Header({ interLinks, darkThemed }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const lastYRef = useRef(0);

  useMotionValueEvent(scrollY, "change", (y) => {
    const difference = y - lastYRef.current;
    if (Math.abs(difference) > 180) {
      setHidden(difference > 0);
      lastYRef.current = y;
    }
  });

  const navItems = [
    { href: "benefits", label: "Benefits" },
    { href: "/for-companies", label: "For Companies", isFullPath: true },
    { href: "/for-learners", label: "For Learners", isFullPath: true },
    { href: "/for-professors", label: "For Professors", isFullPath: true },
    { href: "/about-us", label: "About Us", isFullPath: true },
  ];

  return (
    <motion.div
      animate={hidden ? "hidden" : "visible"}
      initial="visible"
      whileHover={hidden ? "peeking" : "visible"}
      onFocusCapture={hidden ? () => setHidden(false) : undefined}
      variants={{
        visible: { y: "0%" },
        hidden: { y: "-90%" },
        peeking: { y: "0%" },
      }}
      transition={{
        duration: 0.2,
        delay: 0.3,
        type: "spring",
        stiffness: 150,
      }}
      className={`z-30 fixed pt-8 top-0 left-[2.5%] w-[95%]`}
    >
      <div
        className={`${
          darkThemed ? "bg-dark-gray" : "bg-white"
        } rounded-full m-2 relative drop-shadow-lg `}
      >
        <div className="px-2 py-2 w-full">
          <div className="flex items-center justify-between  w-full">
            {/* Hamburger menu for mobile */}
            <div className="md:hidden flex items-center ml-2 z-50">
              <button
                onClick={() => setIsMenuOpen((prevState) => !prevState)}
                className={`${
                  darkThemed ? "text-gray-100" : "text-gray-700"
                } hover:text-blue-600 focus:outline-none`}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
              </button>
            </div>
            <Link href={interLinks ? "/#hero" : "#hero"}>
              <div className="flex items-center justify-start px-2">
                <Image
                  src="/land/discurso_logo.png"
                  alt="Discurso.AI Logo"
                  width={32}
                  height={32}
                  className="mr-2 z-50"
                />
                <span
                  className={`${
                    darkThemed ? "text-white" : "text-black"
                  } text-xl font-bold z-50`}
                >
                  Discurso<span className="text-blue-600">.AI</span>
                </span>
              </div>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:flex justify-center md:z-50">
              <nav className="flex flex-nowrap space-x-6">
                {navItems.map((item, index) => (
                  <a
                    key={index}
                    href={
                      item.isFullPath
                        ? item.href
                        : interLinks
                        ? `/#${item.href}`
                        : `#${item.href}`
                    }
                    className={`${
                      darkThemed ? "text-gray-100" : "text-gray-800"
                    } text-md hover:text-blue-600/80 whitespace-nowrap`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="flex items-center justify-end z-50">
              <Link href="/signin">
                <Button className="bg-blue-500 text-white hover:bg-blue-700 rounded-full px-2 md:px-6 font-semibold">
                  Log in
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile navigation menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ scaleY: 0 }}
              animate={{
                scaleY: 1,
                transition: { duration: 0.3, type: "spring", stiffness: 75 },
              }}
              exit={{
                scaleY: 0,
                transition: {
                  duration: 0.3,
                  delay: 0.6,
                },
              }}
              className={`${
                darkThemed ? "bg-dark-gray" : "bg-white"
              } md:hidden p-4 pt-6 absolute top-[calc(100%-28px)] left-0 right-0 rounded-b-2xl shadow-lg z-40 origin-top`}
            >
              <nav className="flex flex-col items-center space-y-5 pt-2">
                {navItems.map((item, index) => (
                  <motion.a
                    key={index}
                    href={
                      item.isFullPath
                        ? item.href
                        : interLinks
                        ? `/#${item.href}`
                        : `#${item.href}`
                    }
                    initial={{ opacity: 0, y: -20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.2,
                        delay: index * 0.1 + 0.3,
                        type: "spring",
                        stiffness: 100,
                      },
                    }}
                    exit={{
                      opacity: 0,
                      y: -20,
                      transition: {
                        duration: 0.2,
                        delay: (navItems.length - index) * 0.1,
                      },
                    }}
                    className={`${
                      darkThemed ? "text-gray-100" : "text-gray-800"
                    } text-md hover:text-blue-600/80 py-1 w-full ${
                      index < navItems.length - 1
                        ? "border-b border-gray-100 pb-3"
                        : ""
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </motion.a>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
