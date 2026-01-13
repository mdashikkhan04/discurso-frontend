import Header from "@/components/land/Header";
import Footer from "@/components/land/Footer";

const ToS = () => {
    return (
        <div className="min-h-screen bg-soft-white">
            <Header interLinks={true} darkThemed={true} />

            <section className="py-12" id="terms-of-service">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Terms Header */}
                    <div className="flex flex-col items-center mb-16">
                        <div className="max-w-3xl text-center">
                            <span className="inline-block px-4 py-2 rounded-full bg-pale-blue text-blue-500 mb-4 text-sm">
                                Legal Information
                            </span>
                            <h2 className="text-4xl font-bold text-gray-900 mt-4 mb-6">
                                Terms of Service
                            </h2>
                            <p className="text-gray-600 mb-8">
                                These terms constitute a legally binding agreement between you and Discurso.AI regarding your use of our platform and services. By accessing or using our platform, you agree to be bound by these terms.
                            </p>
                        </div>
                    </div>

                    {/* Effective Date & Privacy Policy Link */}
                    <div className="max-w-3xl mx-auto mb-12 pb-6 border-b">
                        <div className="flex flex-col sm:flex-row items-center justify-between">
                            <p className="text-gray-500 mb-4 sm:mb-0">Last updated: May 20, 2025</p>
                            <a href="/privacy-policy" className="text-blue-500 hover:text-blue-700 font-medium">
                                View our Privacy Policy →
                            </a>
                        </div>
                    </div>

                    {/* Terms Sections */}
                    <div className="max-w-3xl mx-auto mb-16">
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h3>
                            <p className="text-gray-600 mb-4">
                                To access and use our platform you will be prompted to agree to these Terms and our Privacy Policy. If you disagree, you may not use the platform. Should you want to withdraw your agreement please reach out to us.
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h3>
                            <p className="text-gray-600">
                                You must be at least 18 years old or the legal age in your jurisdiction to use our platform.
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Account Responsibilities</h3>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>You must provide accurate and complete information</li>
                                <li>You are responsible for maintaining the security of your credentials</li>
                                <li>You must notify us immediately of unauthorized access to your account</li>
                                <li>We reserve the right to disable or terminate any account at our discretion</li>
                            </ul>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h3>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>Do not interfere with or disrupt the platform</li>
                                <li>Do not reverse-engineer or exploit any part of the platform</li>
                                <li>Do not use the service for unlawful or harmful activities</li>
                            </ul>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property</h3>
                            <p className="text-gray-600 mb-4">
                                All content, logos, and underlying technology belong to Discurso.AI or its licensors.
                            </p>
                            <p className="text-gray-600">
                                Do not reproduce or distribute without permission.
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">6. AI Services</h3>
                            <p className="text-gray-600 mb-4">
                                When using our AI features, your inputs may be processed by OpenAI.
                            </p>
                            <p className="text-gray-600">
                                You agree not to input sensitive or personal data unless necessary and understand how your data may be used to improve models.
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h3>
                            <p className="text-gray-600">
                                We provide the platform “as is,” without warranties. We are not liable for any loss resulting from your use or inability to use the service.
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">8. Indemnification</h3>
                            <p className="text-gray-600">
                                You agree to indemnify and hold harmless Discurso.AI from any claims, losses, or damages arising from your misuse of the platform.
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h3>
                            <p className="text-gray-600">
                                We may suspend or terminate your access at any time, particularly if these Terms are violated.
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">10. Modifications</h3>
                            <p className="text-gray-600">
                                We may update these Terms. Continued use means you accept the new version.
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law and Disputes</h3>
                            <p className="text-gray-600">
                                These Terms are governed by the laws of Poland. Any disputes will be resolved in the courts of that jurisdiction.
                            </p>
                        </div>
                    </div>


                    {/* Contact Section */}
                    <div className="max-w-3xl mx-auto p-8 bg-gray-50 rounded-lg">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Questions About Our Terms?</h3>
                        <p className="text-gray-600 mb-2">
                            If you have any questions about these Terms of Service, please contact us at:
                        </p>
                        <a href="mailto:legal@discurso.ai" className="text-blue-500 hover:text-blue-700 font-medium">
                            support@discurso.ai
                        </a>
                    </div>
                </div>
            </section>
            <Footer interLinks={true} />
        </div>
    );
};

export default ToS;
