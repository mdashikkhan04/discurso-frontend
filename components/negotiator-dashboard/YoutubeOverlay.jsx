"use client";

export default function YouTubeOverlay({ 
  youtubeId, 
  isOpen,
  onClose,
  onDoNotShowAgain,
  showDoNotShowAgainButton = true
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
      onClick={onClose} 
    >
      <div 
        className="bg-white rounded-2xl p-6 w-[90%] max-w-[900px] relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* localStorage.removeItem("eventIntroHidden"); */}
        {/* YT embed */}
        <iframe
          width="100%"
          height="500px"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
          title="Event introduction"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="rounded-xl"
        ></iframe>

        {/* Buttons */}
        <div className={`flex mt-6 ${showDoNotShowAgainButton ? 'justify-between' : 'justify-end'}`}>
          {showDoNotShowAgainButton && (
            <button
              onClick={onDoNotShowAgain}
              className="px-6 py-2 border rounded-xl font-semibold"
            >
              Do not show again
            </button>
          )}

          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#0973F7] text-white rounded-xl font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}