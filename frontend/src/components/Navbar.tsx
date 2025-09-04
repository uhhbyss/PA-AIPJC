import Link from 'next/link';
import React from 'react';

const Navbar: React.FC = () => {
    return (
        <nav className="bg-gray-800 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold hover:text-gray-300">
                    AI Journal
                </Link>
                <div className="flex gap-4">
                    <Link href="/" className="hover:text-gray-300">
                        Home
                    </Link>
                    <Link href="/write" className="hover:text-gray-300">
                        Write
                    </Link>
                    <Link href="/settings" className="hover:text-gray-300">
                        Settings
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;