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
            <div className="flex gap-4 mt-6">
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-[#2c3440] hover:bg-[#3c4656] text-white py-2 px-6 rounded font-bold flex items-center gap-2 transition-colors border border-[#445566]"
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
