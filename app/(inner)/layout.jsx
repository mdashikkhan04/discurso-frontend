import FooterAdminTools from "@/components/FooterAdminTools";
import Header from "@/components/Header";

export default async function InnerLayout({ children }) {
    return (
        <>
            <Header />
            {children}
            <FooterAdminTools />
        </>
    );
}