"use client";

import { Settings, LogOut } from 'lucide-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useLoading } from "@/contexts/LoadingContext";
import { useState } from "react";
import ProfileForm from "@/components/ProfileForm";
import { getProfileData } from "@/actions/profile";

export default function Header() {
  const [showProfile, setShowProfile] = useState(false);
  const { role, logout } = useUser();
  const { showLoading, hideLoading } = useLoading();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const profileData = await getProfileData();
      setProfile(profileData);
    }
    fetchData();
  }, []);

  const dashboardLink = `/${role}`;

  const handleLogout = async () => {
    showLoading();
    try {
      await logout();
      window.location.href = "/signin";
    } catch (error) {
      console.error("Logout error:", error);
    }
    hideLoading();
  };

  return (
    <>
      <header>
        <div className="flex items-center md:h-16 bg-white rounded-full m-2 relative">
          <div className="px-2 w-full">
            <div className="flex items-center justify-between w-full">
              <Link href={dashboardLink}>
                <div className="flex items-center justify-start">
                  <Image
                    src="/land/discurso_logo.png"
                    alt="Discurso.AI Logo"
                    className="mr-2"
                    width={32}
                    height={32}
                  />
                  <span className="hidden md:block text-xl font-bold hover:text-blue-600/80">
                    Discurso<span className="text-blue-600">.AI</span>
                  </span>
                </div>
              </Link>
              <div className="items-center justify-end">
                <nav className="flex items-center space-x-2">
                  <Settings className="mr-5 h-5 w-5 margin hover:text-blue-600/80" onClick={() => setShowProfile(true)} />
                  {process.env.NEXT_PUBLIC_ENVIRON !== 'prod' ? (
                    <Link
                      href="/negotiator/profile"
                      className="inline-flex items-center gap-4 text-md text-gray-800 hover:text-blue-600/80 font-semibold"
                    >
                      {profile?.avatarUrl ? (
                        <Image
                          src={profile.avatarUrl}
                          alt="Profile avatar"
                          width={30}
                          height={30}
                          className="w-8 h-8 object-cover rounded-full"
                        />
                      ) : null}
                      <div className="hidden md:block">
                        <p>{profile?.nickname}</p>
                        <p className="font-light text-gray-500 -mt-1.5">{profile?.email}</p>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      href="/"
                      className="text-md text-gray-800 hover:text-blue-600/80 font-semibold"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowProfile(true);
                      }}
                    >
                      Profile
                    </Link>
                  )}
                  <Button variant="outline" className="md:!ml-8 text-sm rounded-full px-4 md:px-6 font-semibold hover:bg-red-500 hover:text-white" onClick={handleLogout}>
                    <span className="md:hidden"><LogOut /></span>
                    <span className="hidden md:inline">Log out</span>
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>
      {showProfile && (
        <ProfileForm onClose={() => { setShowProfile(false) }} />
      )}
    </>
  );
};
