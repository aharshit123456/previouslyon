'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import AddToListModal from './add-to-list-modal';

interface ShowActionsProps {
    show: {
        id: number;
        name: string;
        poster_path: string | null;
        first_air_date: string;
    }
}

export default function ShowActions({ show }: ShowActionsProps) {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            <div className="flex gap-4">
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-white hover:bg-black hover:text-white text-black py-4 px-8 rounded-full font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all border-2 border-black shadow-lg"
                >
                    <Plus className="w-4 h-4" /> Add to List
                </button>
                {/* Future: Add Review Button for Show level here */}
            </div>

            <AddToListModal
                show={show}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}
