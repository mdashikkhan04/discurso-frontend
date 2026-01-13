import { Mail } from "lucide-react";
import {
  FaLinkedin,
} from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

export default function Footer({ interLinks }) {
  return (
    <footer className="bg-dark-gray text-white pt-8 pb-4 md:pb-8" id="contact">
      <div className="container mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-8 mb-4">
          <div className="md:col-span-2">
            <Link href={interLinks ? "/#hero" : "#hero"}>
              <div className="flex items-center mb-4">
                <div>
                  <Image
                    src="/land/discurso_logo.png"
                    alt="Discurso.AI Logo"
                    width={36}
                    height={36}
                    className="mr-2"
                  />
                </div>
                <span className="text-4xl font-bold">
                  Discurso<span className="text-blue-600">.AI</span>
                </span>
              </div>
            </Link>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Pages</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={interLinks ? "/#benefits" : "#benefits"}
                  className="text-gray-400 hover:text-white">
                  Benefits
                </a>
              </li>
              <li>
                <a
                  href={interLinks ? "/#for-companies" : "#for-companies"}
                  className="text-gray-400 hover:text-white"
                >
                  For Companies
                </a>
              </li>
              <li>
                <a
                  href={interLinks ? "/#for-learners" : "#for-learners"}
                  className="text-gray-400 hover:text-white"
                >
                  For Learners
                </a>
              </li>
              <li>
                <a
                  href={interLinks ? "/#for-professors" : "#for-professors"}
                  className="text-gray-400 hover:text-white"
                >
                  For Professors
                </a>
              </li>
              <li>
                <a href="/about-us" className="text-gray-400 hover:text-white">
                  About Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/privacy-policy"
                  className="text-gray-400 hover:text-white"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms-of-service"
                  className="text-gray-400 hover:text-white"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.linkedin.com/company/discurso-ai/"
                  className="text-gray-400 hover:text-white flex items-center gap-2"
                >
                  <FaLinkedin className="h-5 w-5" />
                  <span>Discurso.AI</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@discurso.ai"
                  className="text-gray-400 hover:text-white flex items-center gap-2"
                >
                  <Mail className="h-5 w-5" />
                  <span>support@discurso.ai</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <p className="text-center text-gray-400 text-sm">
            Copyright © 2025 Econnections Sp. z o. o. - All rights reserved.
          </p>
        </div>
      </div>
    </footer >
  );
};
