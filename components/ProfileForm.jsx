"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect } from "react";
import { fetcher } from "@/lib/fetcher";
import { showSuccessToast, showErrorToast } from "@/components/toast";
import { useLoading } from "@/contexts/LoadingContext";
import { useUser } from "@/contexts/UserContext";

export default function ProfileForm({ onClose }) {
    const [userData, setUserData] = useState(null);
    const [emailError, setEmailError] = useState(null);
    const { showLoading, hideLoading } = useLoading();
    const { user } = useUser();

    useEffect(() => {
        if (!user) return;
        const fetchUserData = async () => {
            showLoading();
            try {
                const response = await fetcher.get("/api/data/profile", user);
                if (response.ok) {
                    setUserData(response.result.data);
                    // console.log("User data:", response.result);
                    // console.log("User data:", response.result.data);
                } else {
                    console.error("Failed to fetch user data:", response.error);
                    showErrorToast("Failed to fetch user data");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                showErrorToast("Error fetching user data");
            }
            hideLoading();
        }
        fetchUserData();
    }, [user]);

    const handleInputChange = (field, val) => {
        setUserData((prev) => ({ ...prev, [field]: val }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user) return;

        if (!userData.email) {
            setEmailError("Email is required");
            return;
        } else if (!userData.email.includes("@") || !userData.email.includes(".")) {
            setEmailError("Email is invalid");
            return;
        } else {
            setEmailError("");
        }

        showLoading();
        try {
            const response = await fetcher.post("/api/data/profile", {
                data: userData,
            }, user);
            if (response.ok) {
                setUserData(response.result.data);
                showSuccessToast("Profile updated");
            } else {
                console.error("Failed to save profile:", response.error);
                showErrorToast("Failed to save profile");
            }
        } catch (error) {
            console.error("Error during save:", error);
            showErrorToast("Error during save");
        }
        hideLoading();
    };

    return (
        // <main className="flex flex-col min-h-screen p-6 bg-white">
        <div>
            {userData && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-md w-96">
                        {/* <h3 className="text-xl font-bold mb-4">Add New User</h3> */}
                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Email Field */}
                            <div>
                                <Label htmlFor="userEmail">Email</Label>
                                <Input
                                    id="userEmail"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={userData.email}
                                    onChange={(e) =>
                                        handleInputChange("email", e.target.value)
                                    }
                                    required
                                />
                            </div>

                            {/* Fullname Field */}
                            <div>
                                <Label htmlFor="addUserFullname">Full Name</Label>
                                <Input
                                    id="userName"
                                    type="text"
                                    placeholder="John Doe"
                                    value={userData.displayName}
                                    onChange={(e) =>
                                        handleInputChange("displayName", e.target.value)
                                    }
                                />
                            </div>

                            {/* Organization Field */}
                            <div>
                                <Label htmlFor="userOrg">Organization</Label>
                                <Input
                                    id="userOrg"
                                    type="text"
                                    placeholder="University or Organization"
                                    value={userData.organisation}
                                    onChange={(e) =>
                                        handleInputChange("organisation", e.target.value)
                                    }
                                />
                            </div>

                            {/* Student ID Field */}
                            {userData.role === "negotiator" && (
                                <div>
                                    <Label htmlFor="userStudentId">Student ID</Label>
                                    <Input
                                        id="userStudentId"
                                        type="text"
                                        placeholder="Student ID"
                                        value={userData.studentId}
                                        onChange={(e) =>
                                            handleInputChange("studentId", e.target.value)
                                        }
                                    />
                                </div>
                            )}

                            {/* Password Field */}
                            <div>
                                <Label htmlFor="userPassword">New Password</Label>
                                <Input
                                    id="userPassword"
                                    type="password"
                                    placeholder="Enter password"
                                    value={userData.password}
                                    onChange={(e) =>
                                        handleInputChange("password", e.target.value)
                                    }
                                // required
                                />
                            </div>

                            {emailError && (
                                <p className="text-red-500 text-sm">{emailError}</p>
                            )}

                            <div className="flex justify-end space-x-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                >
                                    Close
                                </Button>
                                <Button type="submit" variant="default">
                                    Save
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        // </main>
    );
}
