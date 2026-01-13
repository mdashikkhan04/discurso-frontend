import Image from "next/image";

export default function PlayerTag({
  playerAvatar = null,
  sideName = "",
  vsAI = true,
  emails = [],
  isPrimary = true,
}) {
  return (
    <div
      className={`flex flex-col gap-2 relative md:w-fit w-full`}
    >
      <div className={`flex items-center gap-3 ${!isPrimary && "flex-row-reverse"}`}>
      <div className="!w-10 !h-10 shrink-0 rounded-full border-2 border-soft-gray flex items-center justify-center">
        {
          //TODO: Add player avatar here
        }
        {vsAI && !isPrimary && (
          <Image src="/ai-stars-purple.png" width={24} height={24} alt="Ai" />
        )}
      </div>
      <div
        className={`px-4 py-1 rounded-full ${
          isPrimary
            ? "bg-gradient-to-b from-vivid-blue to-deep-blue"
            : "border-2 border-soft-gray"
        }`}
      >
        <span
          className={`${
            isPrimary ? "text-white" : "text-darker-gray"
          } font-semibold text-lg line-clamp-1`}
        >
          {sideName}
        </span>
      </div>
      </div>
      <div className={`flex flex-row flex-wrap ${isPrimary ? "justify-start" : "justify-end"} w-full gap-2`}>
        {!vsAI &&
          emails.map((email, i) => {
            return (
              <span
                key={email + i}
                className={`text-sm text-gray-500`}
              >
                {email + (i < emails.length - 1 ? ", " : "")}
              </span>
            );
          })}
      </div>
    </div>
  );
}
