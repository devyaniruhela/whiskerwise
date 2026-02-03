import Header from '@/components/layout/Header';
import AboutSection from '@/components/layout/AboutSection';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="pt-8 pb-16">
        <AboutSection />
      </main>
      <Footer />
    </>
  );
}
