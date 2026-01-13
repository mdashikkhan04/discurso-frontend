"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { fetcher } from "@/lib/fetcher";
import { showSuccessToast, showErrorToast } from "@/components/toast";
import { useLoading } from "@/contexts/LoadingContext";
import {
  sendPasswordReset,
} from "@/lib/client/auth";
import { getWelcomeLoginLink, getUsers } from "@/actions/auth";
import { useUser } from "@/contexts/UserContext";
import Pagination from "@/components/Pagination";
import {
  Search,
  UserPlus,
  Download,
  Save,
  KeyRound,
  UserX,
  Trash2,
  FileText,
  Shield,
  ShieldCheck,
  Mail,
  MailCheck,
  User,
  Users,
  Link,
  UserRoundCog
} from "lucide-react";
import InviteLinks from "@/components/InviteLinks";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isInvitesOpen, setIsInvitesOpen] = useState(false);
  const [emailError, setEmailError] = useState("");
  const { showLoading, hideLoading } = useLoading();
  const [newUser, setNewUser] = useState({
    email: "",
    displayName: "",
    role: "",
    organization: "",
    password: "",
    studentId: "",
    sendWelcomeEmail: true,
  });
  const { user } = useUser();

  const fetchUsers = async (page = 1, searchTerm = "") => {
    if (!user) return;
    showLoading();
    try {
      const result = await getUsers(page, searchTerm);
      setUsers(result.users);
      setTotalPages(result.totalPages);
      setTotal(result.total);
      setCurrentPage(result.currentPage);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    fetchUsers(1, "");
  }, [user]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1);
    fetchUsers(1, search);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchUsers(page, search);
  };

  const handleInputChange = (uid, field, value) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.uid === uid ? { ...user, [field]: value } : user
      )
    );
  };

  const handleSave = async (uid) => {
    const auser = users.find((u) => u.uid === uid);
    showLoading();
    try {
      const response = await fetcher.post(`/api/auth/admin/users/${uid}`, {
        ...auser,
      }, user);
      if (response.ok) {
        showSuccessToast("User updated");
      } else {
        console.error("Failed to save user:", response.error);
        showSuccessToast("Failed to update user");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      showSuccessToast("Error during updating user");
    }
    hideLoading();
  };

  const handleResetPassword = async (email) => {
    try {
      showLoading();
      await sendPasswordReset(email);
      showSuccessToast("Password reset email sent");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      showErrorToast("Error during sending password reset email");
    }

    hideLoading();
  };

  const handleDeactivate = async (uid) => {
    const user = users.find((u) => u.uid === uid);
    const updatedUser = { ...user, disabled: !user.disabled };

    showLoading();
    try {
      const response = await fetcher.post(
        `/api/auth/admin/users/${uid}`,
        updatedUser, user
      );
      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === uid ? { ...u, disabled: updatedUser.disabled } : u
          )
        );
        let currentState = updatedUser.disabled ? "deactivated" : "activated";
        showSuccessToast(`User ${currentState}`);
      } else {
        let currentState = updatedUser.disabled ? "deactivate" : "activate";
        console.error(`Failed to ${currentState} user:`, response.error);
        showErrorToast(`Failed to ${currentState}`);
      }
    } catch (error) {
      console.error(
        `Error updating user ${updatedUser.disabled ? "deactivate" : "activate"
        }:`,
        error
      );
      showErrorToast("Error");
    }
    hideLoading();
  };

  const handleResetTerms = async (uid) => {
    const userToReset = users.find((u) => u.uid === uid);
    if (!confirm(`Reset terms acceptance for user ${userToReset.email} ?`)) return;
    showLoading();
    try {
      const response = await fetcher.post(`/api/auth/terms`, { email: userToReset.email, acceptedTerms: 0 }, user);
      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === uid ? { ...u, acceptedTerms: 0 } : u
          )
        );
        showSuccessToast("Terms reset for user");
      } else {
        console.error(`Failed to reset terms for user ${userToReset.email} :`, response.error);
        showErrorToast("Failed to reset terms for user");
      }
    } catch (error) {
      console.error(`Error resetting terms for user ${userToReset.email}:`, error);
      showErrorToast("Error during resetting terms");
    }
    hideLoading();
  };

  const handleWelcomeLink = async (uid, email) => {
    try {
      showLoading();
      const link = await getWelcomeLoginLink(uid, email);
      if (link) {
        await navigator.clipboard.writeText(link);
        showSuccessToast("Welcome link copied to clipboard");
      }
    } catch (error) {
      console.error("Error generating welcome link:", error);
      showErrorToast("Error during generating welcome link");
    } finally {
      hideLoading();
    }
  };

  const handleDelete = async (uid) => {
    const userToDelete = users.find((u) => u.uid === uid);
    if (confirm(`Delete user ${userToDelete.email} ?`) != true) {
      return;
    }
    showLoading();
    try {
      const response = await fetcher.delete(`/api/auth/admin/users/${uid}`, user);
      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.uid !== uid));
        showSuccessToast("User deleted");
      } else {
        console.error(`Failed to delete user ${userToDelete.email} :`, response.error);
        showErrorToast("Failed to delete user");
      }
    } catch (error) {
      console.error(`Error deleting user ${userToDelete.email}:`, error);
      showErrorToast("Error during deleting");
    }
    hideLoading();
  };

  const handleNewUserInputChange = (field, value) => {
    if (field === "sendWelcomeEmail") {
      const { checked } = value;
      value = checked;
    }
    setNewUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUser.email) {
      setEmailError("Email is required.");
      return;
    }
    if (!newUser.password) {
      setEmailError("Password is required.");
      return;
    }
    if (newUser.password.length < 6) {
      setEmailError("Password is too short.");
      return;
    }
    if (!newUser.role) {
      setEmailError("Role is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    showLoading();
    try {
      const response = await fetcher.post(`/api/auth/new-user`, newUser, user);
      if (response.ok) {
        closeAddUserModal();
        await fetchUsers(currentPage, search);
        showSuccessToast("User added");
      } else {
        console.error("Failed to add user:", response.error);
        setEmailError("Failed to add user");
        showErrorToast("Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      setEmailError("An error occurred while adding the user");
      showErrorToast("An error occurred while adding the user");
    }
    hideLoading();
  };

  const openAddUserModal = () => {
    setIsAddUserOpen(true);
    setNewUser({
      email: "",
      displayName: "",
      role: "",
      organization: "",
      password: "",
      studentId: "",
      maxUsers: "",
      sendWelcomeEmail: true,
    });
    setEmailError("");
  };

  const closeAddUserModal = () => {
    setIsAddUserOpen(false);
    setEmailError("");
  };

  const filteredUsers = users;

  const downloadCSV = () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      return;
    }
    const headers = Object.keys(filteredUsers[0]);
    const csvContent = [
      headers.join(","),
      ...filteredUsers.map((user) =>
        headers.map((header) => JSON.stringify(user[header] ?? "")).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "user_list.csv";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-soft-white via-pale-blue/30 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pale-gray shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search users by any field..."
                  value={search}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                  className="pl-10 h-12 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Button
                  onClick={handleSearchSubmit}
                  variant="outline"
                  className="h-12 px-6 rounded-xl font-medium border-pale-gray hover:border-vivid-blue hover:text-vivid-blue transition-all duration-200"
                >
                  <Search size={20} className="mr-2" />
                  Search
                </Button>
                <Button
                  onClick={openAddUserModal}
                  className="bg-vivid-blue hover:bg-deep-blue text-white h-12 px-6 rounded-xl font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <UserPlus size={20} className="mr-2" />
                  Add User
                </Button>
                <Button
                  onClick={downloadCSV}
                  variant="outline"
                  className="h-12 px-6 rounded-xl font-medium border-pale-gray hover:border-vivid-blue hover:text-vivid-blue transition-all duration-200 hover:scale-105"
                >
                  <Download size={20} className="mr-2" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => setIsInvitesOpen(true)}
                  variant="outline"
                  className="h-12 px-6 rounded-xl font-medium border-pale-gray hover:border-vivid-blue hover:text-vivid-blue transition-all duration-200 hover:scale-105"
                >
                  <Link size={20} className="mr-2" />
                  Invite Links
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-pale-gray">
              <div className="text-center">
                <div className="text-2xl font-bold text-vivid-blue">{total}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredUsers.filter(u => !u.disabled).length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {filteredUsers.filter(u => u.disabled).length}
                </div>
                <div className="text-sm text-gray-600">Inactive</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {filteredUsers.filter(u => u.role === "instructor").length}
                </div>
                <div className="text-sm text-gray-600">Instructors</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.uid} className="bg-white/90 backdrop-blur-sm border-pale-gray shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="bg-gradient-to-r from-pale-blue/50 to-white border-b border-pale-gray">
                <CardTitle className="flex flex-col space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <User size={20} className="text-vivid-blue" />
                      <span className={`font-mono text-sm ${user.disabled ? "text-gray-500" : "text-darker-gray"}`}>
                        {user.uid}
                      </span>
                    </div>

                    {!user.isUser && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                        <Shield size={14} />
                        ADMIN
                      </span>
                    )}

                    {user.disabled && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                        <UserX size={14} />
                        INACTIVE
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className={`flex items-center gap-2 text-sm ${user.acceptedTerms ? "text-green-700" : "text-gray-600"}`}>
                      {user.acceptedTerms ? <ShieldCheck size={16} /> : <FileText size={16} />}
                      <span>{user.acceptedTerms ? "Terms Accepted" : "Terms Pending"}</span>
                    </div>

                    <div className={`flex items-center gap-2 text-sm ${user.emailVerified ? "text-green-700" : "text-orange-600"}`}>
                      {user.emailVerified ? <MailCheck size={16} /> : <Mail size={16} />}
                      <span>{user.emailVerified ? "Email Verified" : "Email Unverified"}</span>
                    </div>

                    {user.createdByName && (
                      <div className="flex items-center gap-1 text-sm text-blue-900">
                        <UserRoundCog size={16} />
                        <span>Created by: {user.createdByName}</span>
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor={`email-${user.uid}`} className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      id={`email-${user.uid}`}
                      type="email"
                      placeholder="Email"
                      value={user.email || ""}
                      onChange={(e) => handleInputChange(user.uid, "email", e.target.value)}
                      disabled={!user.isUser}
                      className="h-11 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`name-${user.uid}`} className="text-sm font-medium text-gray-700">Full Name</Label>
                    <Input
                      id={`name-${user.uid}`}
                      type="text"
                      placeholder="Full Name"
                      value={user.displayName || ""}
                      onChange={(e) => handleInputChange(user.uid, "displayName", e.target.value)}
                      disabled={!user.isUser}
                      className="h-11 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Role</Label>
                    <Select
                      value={user.role || ""}
                      onValueChange={(value) => handleInputChange(user.uid, "role", value)}
                      disabled={!user.isUser}
                    >
                      <SelectTrigger className="h-11 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="negotiator">Negotiator</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`organisation-${user.uid}`} className="text-sm font-medium text-gray-700">Organisation</Label>
                    <Input
                      id={`organisation-${user.uid}`}
                      type="text"
                      placeholder="Organisation"
                      value={user.organisation || ""}
                      onChange={(e) => handleInputChange(user.uid, "organisation", e.target.value)}
                      disabled={!user.isUser}
                      className="h-11 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                    />
                  </div>

                  {user.role === "negotiator" && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`studentId-${user.uid}`} className="text-sm font-medium text-gray-700">Student ID</Label>
                      <Input
                        id={`studentId-${user.uid}`}
                        type="text"
                        placeholder="Student ID"
                        value={user.studentId || ""}
                        onChange={(e) => handleInputChange(user.uid, "studentId", e.target.value)}
                        disabled={!user.isUser}
                        className="h-11 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                      />
                    </div>
                  )}

                  {user.role === "instructor" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`maxUsers-${user.uid}`} className="text-sm font-medium text-gray-700">Max users to create (default: 50)</Label>
                        <Input
                          id={`maxUsers-${user.uid}`}
                          type="number"
                          placeholder="50"
                          value={user.maxUsers ?? ""}
                          onChange={(e) => handleInputChange(user.uid, "maxUsers", e.target.value)}
                          disabled={!user.isUser}
                          className="h-11 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`maxParticipants-${user.uid}`} className="text-sm font-medium text-gray-700">Max participants per event (default: 50)</Label>
                        <Input
                          id={`maxParticipants-${user.uid}`}
                          type="number"
                          placeholder="50"
                          value={user.maxParticipants ?? ""}
                          onChange={(e) => handleInputChange(user.uid, "maxParticipants", e.target.value)}
                          disabled={!user.isUser}
                          className="h-11 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-pale-gray">
                  <Button
                    onClick={() => handleSave(user.uid)}
                    disabled={!user.isUser}
                    className="bg-vivid-blue hover:bg-deep-blue text-white h-10 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  >
                    <Save size={16} className="mr-2" />
                    Save
                  </Button>

                  <Button
                    onClick={() => handleResetPassword(user.email)}
                    disabled={!user.isUser}
                    variant="outline"
                    className="h-10 px-4 rounded-lg font-medium border-pale-gray hover:border-orange-400 hover:text-orange-600 transition-all duration-200 hover:scale-105"
                  >
                    <KeyRound size={16} className="mr-2" />
                    Reset Password
                  </Button>

                  <Button
                    onClick={() => handleDeactivate(user.uid)}
                    disabled={!user.isUser}
                    variant={user.disabled ? "outline" : "destructive"}
                    className={`h-10 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${user.disabled
                      ? "border-green-400 hover:border-green-500 text-green-600 hover:text-green-700"
                      : ""
                      }`}
                  >
                    <UserX size={16} className="mr-2" />
                    {user.disabled ? "Activate" : "Deactivate"}
                  </Button>

                  <Button
                    onClick={() => handleResetTerms(user.uid)}
                    variant="outline"
                    className="h-10 px-4 rounded-lg font-medium border-pale-gray hover:border-purple-400 hover:text-purple-600 transition-all duration-200 hover:scale-105"
                  >
                    <FileText size={16} className="mr-2" />
                    Reset Terms
                  </Button>

                  <Button
                    onClick={() => handleWelcomeLink(user.uid, user.email)}
                    variant="outline"
                    className="h-10 px-4 rounded-lg font-medium border-pale-gray hover:border-purple-400 hover:text-purple-600 transition-all duration-200 hover:scale-105"
                  >
                    <Link size={16} className="mr-2" />
                    Make Link
                  </Button>                  

                  <Button
                    onClick={() => handleDelete(user.uid)}
                    disabled={!user.isUser}
                    variant="destructive"
                    className="h-10 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or add a new user.</p>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {isAddUserOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-vivid-blue to-deep-blue text-white p-6 rounded-t-2xl">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <UserPlus size={24} />
                Add New User
              </h3>
              <p className="text-blue-100 mt-1">Create a new user account</p>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="addUserEmail" className="text-sm font-medium text-gray-700">Email *</Label>
                <Input
                  id="addUserEmail"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => handleNewUserInputChange("email", e.target.value)}
                  required
                  className="h-11 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addUserFullname" className="text-sm font-medium text-gray-700">Full Name</Label>
                <Input
                  id="addUserFullname"
                  type="text"
                  placeholder="John Doe"
                  value={newUser.displayName}
                  onChange={(e) => handleNewUserInputChange("displayName", e.target.value)}
                  className="h-11 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addUserRole" className="text-sm font-medium text-gray-700">Role *</Label>
                <Select
                  onValueChange={(value) => handleNewUserInputChange("role", value)}
                  required
                >
                  <SelectTrigger className="h-11 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="negotiator">Negotiator</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addUserOrganization" className="text-sm font-medium text-gray-700">Organization</Label>
                <Input
                  id="addUserOrganization"
                  type="text"
                  placeholder="University or Organization"
                  value={newUser.organization}
                  onChange={(e) => handleNewUserInputChange("organization", e.target.value)}
                  className="h-11 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addUserPassword" className="text-sm font-medium text-gray-700">Password *</Label>
                <Input
                  id="addUserPassword"
                  type="password"
                  placeholder="Enter password (min 6 characters)"
                  value={newUser.password}
                  onChange={(e) => handleNewUserInputChange("password", e.target.value)}
                  required
                  className="h-11 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                />
              </div>

              {newUser.role === "negotiator" && (
                <div className="space-y-2">
                  <Label htmlFor="addUserStudentId" className="text-sm font-medium text-gray-700">Student ID</Label>
                  <Input
                    id="addUserStudentId"
                    type="text"
                    placeholder="Student ID"
                    value={newUser.studentId}
                    onChange={(e) => handleNewUserInputChange("studentId", e.target.value)}
                    className="h-11 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                  />
                </div>
              )}

              {newUser.role === "instructor" && (
                <div className="space-y-2">
                  <Label htmlFor="addUserMaxUsers" className="text-sm font-medium text-gray-700">Max Users (default: 50)</Label>
                  <Input
                    id="addUserMaxUsers"
                    type="number"
                    placeholder="50"
                    value={newUser.maxUsers}
                    onChange={(e) => handleNewUserInputChange("maxUsers", e.target.value)}
                    className="h-11 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                  />
                </div>
              )}

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="sendWelcomeEmail"
                  checked={newUser.sendWelcomeEmail || false}
                  onChange={(e) => handleNewUserInputChange("sendWelcomeEmail", e.target)}
                  className="w-4 h-4 text-vivid-blue bg-gray-100 border-gray-300 rounded focus:ring-vivid-blue"
                />
                <label htmlFor="sendWelcomeEmail" className="text-sm font-medium text-gray-700">Send welcome email</label>
              </div>

              {emailError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-red-700 text-sm">{emailError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-pale-gray">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeAddUserModal}
                  className="flex-1 h-11 rounded-lg font-medium border-pale-gray hover:border-gray-400"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 rounded-lg font-medium bg-vivid-blue hover:bg-deep-blue text-white"
                >
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    <InviteLinks open={isInvitesOpen} onClose={() => setIsInvitesOpen(false)} />
    </>
  );
}
