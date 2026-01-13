import { Mail } from "lucide-react";
import { FaLinkedin } from "react-icons/fa";

export default function JoinUsCTA() {
    return (
        <div className="bg-dark-gray text-white text-center py-6 px-4 rounded-2xl mb-4">
            <h2 className="text-2xl md:text-3xl font-semibold mb-8">
                Curious About Discurso<span className="text-blue-600">.AI</span> Or Interested In Joining Us?<br />
                <span className="block mt-1">Reach Out!</span>
            </h2>

            <div className="flex flex-col justify-center items-center gap-6 text-base text-gray-200">
                <a
                    href="https://www.linkedin.com/company/discurso-ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                >
                    <FaLinkedin className="h-5 w-5" />
                    Discurso.AI
                </a>
                <a
                    href="mailto:support@discurso.ai"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                >
                    <Mail className="h-5 w-5" />
                    support@discurso.ai
                </a>
            </div>
        </div>
    );
}
