"use client";

import Link from "next/link";
import { useState } from "react";
import { fetcher } from "@/lib/fetcher";
import { useLoading } from "@/contexts/LoadingContext";
import { useUser } from "@/contexts/UserContext";
import { wipeDataSet } from "@/actions/devTools";
import CaseSearch from "@/components/CaseSearch";
import PictureUpload from "@/components/PictureUpload";
import {
  Users,
  Calendar,
  FileText,
  Bot,
  ListTodo,
  PlusCircle,
  Search,
  Trash2,
  Database,
  Sparkle,
  MessageCircleMore,
  MessagesSquare,
  ImagePlus,
  FileUp,
  GraduationCap,
  UserCog
} from "lucide-react";
import TranscriptUpload from "@/components/TranscriptUpload";

export default function AdminDashboardPage() {
  const AdminTile = ({
    href,
    icon: Icon,
    title,
    description,
    variant = "default",
    onClick,
    disabled = false
  }) => {
    const baseClasses = "group relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg";
    const variantClasses = {
      primary: "bg-gradient-to-br from-white to-pale-blue border-pale-gray shadow-sm hover:shadow-xl hover:border-vivid-blue/30",
      secondary: "bg-white border-pale-gray shadow-sm hover:shadow-lg hover:border-vivid-blue/20",
      warning: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-lg hover:border-orange-300"
    };

    const content = (
      <div className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} p-6 h-full`}>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-3 rounded-xl ${variant === "primary" ? "bg-vivid-blue/10 text-vivid-blue" :
            variant === "warning" ? "bg-orange-500/10 text-orange-600" :
              "bg-darker-gray/10 text-darker-gray"
            }`}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className={`font-semibold text-lg mb-2 text-darker-gray ${variant === "warning" ? "group-hover:text-orange-600" : "group-hover:text-vivid-blue"} transition-colors`}>
              {title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-vivid-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    );

    if (onClick) {
      return (
        <div onClick={disabled ? undefined : onClick}>
          {content}
        </div>
      );
    }

    if (href && !disabled) {
      return <Link href={href}>{content}</Link>;
    }

    return content;
  };

  const { showLoading, hideLoading } = useLoading();
  const { user } = useUser();
  const [inTransfer, setInTransfer] = useState(false);
  const [searchingCase, setSearchingCase] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [uploadingTranscript, setUploadingTranscript] = useState(false);

  const handleEventsDataCopy = async () => {
    if (inTransfer) return;
    if ((confirm("Do you want to copy events, cases, and results from PROD?") != true)) return;
    setInTransfer(true);
    showLoading();
    const transferRes = await fetcher.post("/api/data-copy/events", {}, user);
    hideLoading();
    if (transferRes.ok) {
      alert("Data copied");
    } else {
      alert("Copying failed");
    }
    setInTransfer(false);
  }

  const handleNegotsDataCopy = async () => {
    if (inTransfer) return;
    if ((confirm("Do you want to copy AI negotiations from PROD?") != true)) return;
    setInTransfer(true);
    showLoading();
    const transferRes = await fetcher.post("/api/data-copy/practice", {}, user);
    hideLoading();
    if (transferRes.ok) {
      alert("Data copied");
    } else {
      let msg = "Copying failed";
      alert(msg);
    }
    setInTransfer(false);
  }

  const handleWipe = async (dataSet) => {
    if (confirm(`Are you sure you want to wipe all ${dataSet}?`) != true) return;
    showLoading();
    try {
      await wipeDataSet(dataSet);
      alert(`${dataSet} wiped`);
    } catch (er) {
      console.error(er);
      alert(`Failed to wipe ${dataSet}`);
    }
    hideLoading();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-white via-pale-blue/30 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-darker-gray to-vivid-blue bg-clip-text text-transparent mb-4">
            Admin Control Center
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Platform content management with test and evaluation tools
          </p>
        </div>

        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-vivid-blue to-deep-blue rounded-full mr-4"></div>
            <h2 className="text-2xl font-semibold text-darker-gray">Core Management</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <AdminTile
              href="/admin/users"
              icon={Users}
              title="Users"
              description="Govern platform users, manage permissions and settings"
              variant="primary"
            />
            <AdminTile
              href="/admin/content/events"
              icon={Calendar}
              title="Events"
              description="Create, edit, and manage all negotiation events"
              variant="primary"
            />
            <AdminTile
              href="/admin/content/cases"
              icon={FileText}
              title="Cases"
              description="Create, edit, and manage all negotiation cases"
              variant="primary"
            />
            <AdminTile
              href="/admin/content/journey"
              icon={GraduationCap}
              title="Learning Journey"
              description="Compose and edit the path of negotiator training"
              variant="primary"
            />
            <AdminTile
              icon={Sparkle}
              title="API AI Settings"
              description="Configure AI prompts and behavior for various tasks"
              variant="primary"
              onClick={() => window.open('https://discurso-api-735677914209.europe-west4.run.app/', '_blank')}
            />
            <AdminTile
              icon={UserCog}
              title="User Roles"
              description="Change user roles and add or remove admins"
              variant="primary"
              onClick={() => window.open(`${window.location.origin}/roles.html`, '_blank')}
            />
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-darker-gray to-gray-400 rounded-full mr-4"></div>
            <h2 className="text-2xl font-semibold text-darker-gray">Testing & Tools</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <AdminTile
              href="/admin/test-ai"
              icon={Bot}
              title="AI vs AI"
              description="Simulate negotiations between two AI negotiators for testing performance"
              variant="secondary"
            />
            <AdminTile
              href="/admin/test-feedback"
              icon={ListTodo}
              title="Test Feedback"
              description="Evaluate and test AI-generated negotiation feedback"
              variant="secondary"
            />
            {/* <AdminTile
              href="/admin/content/cases/builder"
              icon={PlusCircle}
              title="Build Case"
              description="Create new negotiation cases using the AI-powered case builder"
              variant="secondary"
            /> */}
            <AdminTile
              href="/admin/ai-chat"
              icon={MessageCircleMore}
              title="Negotiation Chat"
              description="Test AI negotiation with any case in minimal text chat"
              variant="secondary"
            />
            <AdminTile
              href="/admin/ai-chat/realtime"
              icon={MessagesSquare}
              title="Realtime Negotiation"
              description="Test realtime AI negotiation with any case in text or voice"
              variant="secondary"
            />
          </div>
        </div>

        {!process.env.NEXT_PUBLIC_ENVIRON.toLowerCase().includes("prod") && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full mr-4"></div>
              <h2 className="text-2xl font-semibold text-darker-gray">Development Tools</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <AdminTile
                icon={Database}
                title="Copy Events Data"
                description="Import events, cases, and results from production environment"
                variant="warning"
                onClick={handleEventsDataCopy}
                disabled={inTransfer}
              />
              <AdminTile
                icon={Search}
                title="Search Cases"
                description="Advanced search and filtering through case database (without owner filter)"
                variant="warning"
                onClick={() => setSearchingCase(true)}
              />
              {process.env.NEXT_PUBLIC_ENVIRON.toLowerCase().includes("local") && (
                <>
                  <AdminTile
                    icon={Trash2}
                    title="Wipe Events"
                    description="Remove all events from current database"
                    variant="warning"
                    onClick={() => handleWipe("events")}
                  />
                  <AdminTile
                    icon={Trash2}
                    title="Wipe Results"
                    description="Remove all results from current database"
                    variant="warning"
                    onClick={() => handleWipe("results")}
                  />
                </>
              )}
              <AdminTile
                icon={ImagePlus}
                title="Upload profile picture"
                description="Use minimal interface to upload a profile picture for user's profile"
                variant="warning"
                onClick={() => setUploadingPicture(true)}
              />
              <AdminTile
                icon={FileUp}
                title="Upload transcript"
                description="Extract, sanitize, and map speakers from transcript files"
                variant="warning"
                onClick={() => setUploadingTranscript(true)}
              />
            </div>
          </div>
        )}
      </div>

      {searchingCase && (
        <CaseSearch
          onClose={() => setSearchingCase(false)}
          onCaseSelected={(acase) => {
            alert(`Selected case: ${acase.title} [${acase.id}]`);
          }}
        />
      )}

      {uploadingPicture && (
        <PictureUpload
          onClose={() => setUploadingPicture(false)}
        />
      )}

      {uploadingTranscript && (
        <TranscriptUpload
          onClose={() => setUploadingTranscript(false)}
        />
      )}
    </div>
  );
}
