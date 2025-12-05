import React, { useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

const presetTags = [
    { value: '', label: 'Tümü' },
    { value: 'city', label: 'Şehir' },
    { value: 'nature', label: 'Doğa' },
    { value: 'adventure', label: 'Macera' },
    { value: 'culture', label: 'Kültürel' },
];

export default function FilterPanel({
    searchTerm,
    order,
    tag,
    onlyFollowing,
    handleSearch,
    setSearchTerm,
    setOrder,
    setTag,
    setOnlyFollowing,
}) {
    const [openSections, setOpenSections] = useState({
        kategori: true,
        konum: false,
        sure: false,
        butce: false,
    });

    const toggleSection = (section) => {
        setOpenSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    return (
        <div className="space-y-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                Filtrele
            </h2>

            {/* Search Input */}
            <div className="mb-4">
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ara..."
                        className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[rgb(32,38,43)] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </form>
            </div>

            {/* Sort Toggle */}
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setOrder(order === '' || order === 'desc' ? 'asc' : 'desc')}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <span>Sıralama</span>
                    <span className="text-gray-500 dark:text-gray-400">
                        {order === '' || order === 'desc' ? 'Yeni Önce' : 'Eski Önce'}
                    </span>
                </button>
            </div>

            {/* Only Following Filter */}
            {setOnlyFollowing && (
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <label className="flex items-center space-x-3 cursor-pointer py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <input
                            type="checkbox"
                            checked={onlyFollowing || false}
                            onChange={(e) => setOnlyFollowing(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:focus:ring-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Sadece Takip Ettiklerim</span>
                    </label>
                </div>
            )}

            {/* Kategori Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <button
                    onClick={() => toggleSection('kategori')}
                    className="w-full flex items-center justify-between py-3 text-sm font-medium text-gray-900 dark:text-white"
                >
                    <span>Kategori</span>
                    {openSections.kategori ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                    )}
                </button>
                {openSections.kategori && (
                    <div className="mt-3 space-y-2">
                        {presetTags.map(({ value, label }) => (
                            <label
                                key={value || 'all'}
                                className="flex items-center space-x-3 cursor-pointer py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <input
                                    type="radio"
                                    name="category"
                                    value={value}
                                    checked={tag === value}
                                    onChange={() => setTag(value)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:focus:ring-blue-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Konum Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <button
                    onClick={() => toggleSection('konum')}
                    className="w-full flex items-center justify-between py-3 text-sm font-medium text-gray-900 dark:text-white"
                >
                    <span>Konum</span>
                    {openSections.konum ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                    )}
                </button>
                {openSections.konum && (
                    <div className="mt-3 space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 px-2">
                            Yakında eklenecek
                        </p>
                    </div>
                )}
            </div>

            {/* Süre Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <button
                    onClick={() => toggleSection('sure')}
                    className="w-full flex items-center justify-between py-3 text-sm font-medium text-gray-900 dark:text-white"
                >
                    <span>Süre</span>
                    {openSections.sure ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                    )}
                </button>
                {openSections.sure && (
                    <div className="mt-3 space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 px-2">
                            Yakında eklenecek
                        </p>
                    </div>
                )}
            </div>

            {/* Bütçe Section */}
            <div>
                <button
                    onClick={() => toggleSection('butce')}
                    className="w-full flex items-center justify-between py-3 text-sm font-medium text-gray-900 dark:text-white"
                >
                    <span>Bütçe</span>
                    {openSections.butce ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                    )}
                </button>
                {openSections.butce && (
                    <div className="mt-3 space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 px-2">
                            Yakında eklenecek
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

