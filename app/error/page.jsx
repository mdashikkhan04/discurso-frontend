import Header from "@/components/land/Header";
import Footer from "@/components/land/Footer";

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-soft-white">
      <Header interLinks={true} darkThemed={true} />

      <section className="py-6 mt-28" id="error">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex flex-col items-center mb-8">
            <div className="max-w-3xl text-center">
              <span className="inline-block px-4 py-2 rounded-full bg-red-100 mb-4 text-sm text-red-600 font-medium">
                System Error
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-6">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                An error occurred while processing your request. If this keeps
                happening, please contact the Discurso team at
                {" "}
                <a
                  href="mailto:support@discurso.ai"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  support@discurso.ai
                </a>
              </p>
              {/* <div className="flex items-center justify-center gap-4">
                <a
                  href="/"
                  className="text-blue-500 hover:text-blue-700 font-medium"
                >
                  ← Go back to Home
                </a>
              </div> */}
            </div>
          </div>

          <div className="max-w-3xl mx-auto p-4 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              What you can try
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Refresh the page in a moment.</li>
              <li>Check your internet connection.</li>
              <li>
                If the issue persists, please email
                {" "}
                <a
                  href="mailto:support@discurso.ai"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  support@discurso.ai
                </a>
                {" "}
                with details.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Footer interLinks={true} />
    </div>
  );
}
