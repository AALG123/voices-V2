import Image from 'next/image';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <Image
              src="/assets/logo.png"
              alt="Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
            <div className="flex flex-col">
              <h1 className="text-white font-bold text-xl leading-tight">Voices</h1>
              <p className="text-slate-400 text-xs">Master Public Speaking</p>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}