import { useState } from 'react';
import { DessertItem } from './data/desserts';
import { Navbar } from './components/Navbar';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { ProductDetailModal } from './components/ProductDetailModal';
import { HeroSection } from './sections/HeroSection';
import { CraftsmanshipSection } from './sections/CraftsmanshipSection';
import { SignatureCollectionSection } from './sections/SignatureCollectionSection';
import { ContactFooterSection } from './sections/ContactFooterSection';

export function App() {
  const [modalDessert, setModalDessert] = useState<DessertItem | null>(null);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#0B0706] text-ivory">
      <ScrollProgressBar />
      <Navbar />

      <main>
        <HeroSection />

        <CraftsmanshipSection onInspectCake={setModalDessert} />

        <SignatureCollectionSection onSelectDessert={setModalDessert} />
      </main>

      <ContactFooterSection />

      <ProductDetailModal
        dessert={modalDessert}
        onClose={() => setModalDessert(null)}
        onSelectDessert={setModalDessert}
      />
    </div>
  );
}

export default App;
