import Header from "@/components/land/Header";
import Footer from "@/components/land/Footer";

const PrivacyPolicyPage = () => {
    return (
        <div className="min-h-screen bg-soft-white">
            <Header interLinks={true} darkThemed={true} />
            <section className="py-12" id="privacy-policy">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Privacy Policy Header */}
                    <div className="flex flex-col items-center mb-16">
                        <div className="max-w-3xl text-center">
                            <span className="inline-block px-4 py-2 rounded-full bg-pale-blue mb-4 text-sm text-blue-500">
                                Legal Information
                            </span>
                            <h2 className="text-4xl font-bold text-gray-900 mt-4 mb-6">
                                Privacy Policy
                            </h2>
                            <p className="text-gray-600 mb-8">
                                This Privacy Policy describes how your personal information is collected, used, and shared when you use Discurso.AI. We take your privacy seriously and are committed to protecting your personal data.
                            </p>
                        </div>
                    </div>

                    {/* Effective Date & Terms Link */}
                    <div className="max-w-3xl mx-auto mb-12 pb-6 border-b">
                        <div className="flex flex-col sm:flex-row items-center justify-between">
                            <p className="text-gray-500 mb-4 sm:mb-0">Last updated: May 20, 2025</p>
                            <a href="/terms-of-service" className="text-blue-500 hover:text-blue-700 font-medium">
                                View our Terms of Service →
                            </a>
                        </div>
                    </div>

                    {/* Privacy Policy Content */}
                    <div className="max-w-3xl mx-auto mb-16">
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Who We Are</h3>
                            <p className="text-gray-600 mb-4">
                                Discurso.AI is an AI-powered negotiation training platform.
                            </p>
                            <p className="text-gray-600">
                                <strong>Contact:</strong> support@discurso.ai <br />
                                <strong>Company:</strong> Econnections Sp. z o. o. – Gębice 40, 66-620 Gubin, Poland
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">2. What Data We Collect</h3>
                            <p className="text-gray-600 mb-4">
                                We collect the following types of data:
                            </p>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li><strong>Personal Data:</strong> Name, email, institution, student number, and any other information you provide when creating an account or contacting us</li>
                                <li><strong>Usage Data:</strong> IP address, browser type, interaction logs</li>
                                <li><strong>Analytics & Performance:</strong> Via Firebase, including crash logs and session duration</li>
                                <li><strong>Cookies and Tracking:</strong> For session management and analytics</li>
                                <li><strong>AI Interaction Data:</strong> Text you input when using generative AI features</li>
                            </ul>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Why We Collect It</h3>
                            <p className="text-gray-600 mb-4">
                                We use your data to:
                            </p>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>Provide and operate our service</li>
                                <li>Authenticate and manage your account</li>
                                <li>Respond to support requests</li>
                                <li>Improve platform functionality and AI recommendations</li>
                                <li>Detect and prevent security or technical issues</li>
                                <li>To conduct anonymized scientific research and academic studies</li>
                            </ul>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">4. Legal Basis for Processing (GDPR)</h3>
                            <p className="text-gray-600 mb-4">
                                We process data based on:
                            </p>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li><strong>Consent:</strong> For cookies and optional communications</li>
                                <li><strong>Legitimate Interest:</strong> Improving service and analytics</li>
                                <li><strong>Contractual Necessity:</strong> Managing accounts and inquiries</li>
                                <li><strong>Legal Obligation:</strong> For compliance with applicable laws</li>
                            </ul>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Services</h3>
                            {/* <div className="bg-gray-50 p-5 rounded-lg mb-4"> */}
                                <h4 className="font-semibold mb-2">Firebase</h4>
                                <p className="text-gray-600 mb-4">
                                    We use <strong>Google Firebase</strong> for authentication, hosting, and performance monitoring. Firebase may collect authentication details, technical metadata, and crash diagnostics. For more information, see Firebase Privacy Policy.
                                </p>
                                <h4 className="font-semibold mb-2">OpenAI</h4>
                                <p className="text-gray-600 mb-4">
                                    We use <strong>OpenAI</strong> technologies to power our AI features. When you use these features, your inputs may be processed by OpenAI. These interactions are governed by OpenAI’s privacy policy, and we implement safeguards to minimize identifiable data retention.
                                </p>
                                <p className="text-gray-600">
                                    We do <strong>not</strong> sell your data to third parties. We only share it with essential service providers under strict agreements.
                                </p>
                            {/* </div> */}
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies</h3>
                            <p className="text-gray-600 mb-4">
                                We use cookies to:
                            </p>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>Manage sessions</li>
                                <li>Analyze traffic and usage</li>
                            </ul>
                            <p className="text-gray-600 mt-4">
                                You can adjust cookie preferences via your browser settings or our cookie banner.
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h3>
                            <p className="text-gray-600">
                                We retain your data only as long as necessary to fulfill the purposes described in this policy or to comply with legal obligations.
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">8. Data Security</h3>
                            <p className="text-gray-600">
                                We use HTTPS encryption, access control, and regular audits to safeguard your data. However, no internet transmission is ever 100% secure.
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">9. International Transfers</h3>
                            <p className="text-gray-600">
                                If your data is transferred outside the EU (e.g., to US-based servers), we ensure adequate safeguards such as Standard Contractual Clauses.
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">10. Your Rights</h3>
                            <p className="text-gray-600 mb-4">
                                Under the EU GDPR, you have the right to:
                            </p>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>Access your data</li>
                                <li>Rectify inaccuracies</li>
                                <li>Request deletion ("right to be forgotten")</li>
                                <li>Object to certain processing</li>
                                <li>Request a copy in a portable format</li>
                            </ul>
                            <p className="text-gray-600 mt-4">
                                To exercise these rights, email <a href="mailto:support@discurso.ai" className="text-blue-600">support@discurso.ai</a>. We respond within one month.
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">11. Use of Data for Scientific Research</h3>
                            <p className="text-gray-600">
                                We may use anonymized and aggregated data to support academic research and scientific studies related to negotiation training, learning performance, and AI-human interaction. No personally identifiable information will be shared or published without your explicit consent. Participation in such studies is never mandatory, and you may opt out by contacting us.
                            </p>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">12. Updates</h3>
                            <p className="text-gray-600">
                                We may revise this policy and will update the “Last updated” date. Major changes will be announced on our website.
                            </p>
                        </div>
                    </div>


                    {/* Contact Section */}
                    <div className="max-w-3xl mx-auto p-8 bg-gray-50 rounded-lg">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Questions About Our Privacy Practices?</h3>
                        <p className="text-gray-600 mb-2">
                            If you have any questions about this Privacy Policy, please contact us at:
                        </p>
                        <a href="mailto:privacy@discurso.ai" className="text-blue-500 hover:text-blue-700 font-medium">
                            support@discurso.ai
                        </a>
                    </div>
                </div>
            </section>
            <Footer interLinks={true} />
        </div>
    );
};

export default PrivacyPolicyPage;