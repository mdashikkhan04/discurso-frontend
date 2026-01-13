import { useEffect, useState } from "react";
import { FcFolder } from "react-icons/fc";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FeedItemInterface, InstructorDashboardEvent } from "@/types/interfaces";

export default function Feed({ events }: { events: InstructorDashboardEvent[] }) {
  const [feedItems, setFeedItems] = useState<FeedItemInterface[]>([]);
  const [isFullViewOpen, setIsFullViewOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!Array.isArray(events)) return;
    const items: FeedItemInterface[] = events
      .filter((e) => e.finished && !!e.endTime)
      .map<FeedItemInterface>((e) => ({
        title: "Event ended",
        description: `${e.title} has ended. View results.`,
        type: "event-ended",
        link: `/instructor/events/${e.id}`,
      }));

    setFeedItems(items);
  }, [events]);

  return (
    <div className="flex flex-col w-full lg:w-2/5 h-full rounded-2xl lg:flex-shrink-0">
      <div className="flex items-center justify-center w-full rounded-t-2xl h-fit py-2 bg-[#F9F5F5] border">
        <p className="text-lg font-semibold">Feed</p>
      </div>
      <div className="h-64 border-x">
        {feedItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Nothing new happened.</p>
          </div>
        ) : (
          <div className="overflow-y-auto h-64">
            {feedItems.map((item, index) => (
              <FeedItem
                key={index}
                title={item.title}
                description={item.description}
                link={item.link}
                type={item.type}
              />
            ))}
          </div>
        )}
      </div>
      <div
        className="flex items-center justify-center bg-primary w-full h-fit py-2 cursor-pointer rounded-b-2xl hover:brightness-90 transition-all"
        onClick={() => setIsFullViewOpen(true)}
      >
        <p className="text-lg font-semibold text-white">View All</p>
      </div>
      <Sheet open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Feed</SheetTitle>
            <SheetDescription>All recent activities</SheetDescription>
          </SheetHeader>
          {feedItems.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Nothing new happened.</p>
            </div>
          ) : (
            <div className="overflow-y-auto h-full">
              {feedItems.map((item, index) => (
                <FeedItem
                  key={index}
                  title={item.title}
                  description={item.description}
                  link={item.link}
                  type={item.type}
                />
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FeedItem({ title, description, link, type }: FeedItemInterface) {
  return (
    <div className="flex w-full items-center py-2 px-4 gap-4">
      <div className="!w-10 !h-10 shrink-0 rounded-full bg-[#FFECD0] flex items-center justify-center">
        {
          type === "congrats" && <span className="text-lg">🎉</span>
        }
        {type === "new-content" && (
          <span className="text-lg">
            <FcFolder />
          </span>
        )}
        {type === "event-ended" && <span className="text-lg">🎉</span>}
      </div>
      <div className="flex flex-col w-full">
        <p className="text-md font-medium">{title}</p>
        <p className="text-xs text-gray-500 line-clamp-1 overflow-ellipsis">
          {description}
        </p>
      </div>
      <Link
        title="Learn more"
        href={link || "#"}
        className="w-6 h-6 shrink-0 rounded-full bg-primary hover:brightness-90 transition-all flex items-center justify-center cursor-pointer"
      >
        <Plus className="w-6 h-6 text-white" />
      </Link>
    </div>
  );
}
