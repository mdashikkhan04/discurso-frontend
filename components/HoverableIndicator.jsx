export default function HoverableIndicator({ children, text }) {
    return (
        <span className="relative flex items-center group">
            {children}
            <span className="absolute bottom-full mb-1 hidden w-max max-w-xs rounded-md bg-gray-700 p-2 text-sm font-medium text-white group-hover:block">
                {text}
            </span>
        </span>
    );
}