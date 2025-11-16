import { Label, Sidebar, TextInput } from "flowbite-react";
import { HiOutlineMinusSm, HiOutlinePlusSm } from "react-icons/hi";
import { BiSolidCategory } from "react-icons/bi";
import { twMerge } from "tailwind-merge";
import { TiArrowUnsorted } from "react-icons/ti";
import { AiOutlineSearch } from 'react-icons/ai'

const presetTags = [
    { value: '', label: 'All routes' },
    { value: 'city', label: 'City breaks' },
    { value: 'nature', label: 'Nature escapes' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'culture', label: 'Culture & history' },
];

export default function SearchSidebar({
    handleSearch,
    setSearchTerm,
    searchTerm,
    setOrder,
    order,
    setTag,
    tag,
}) {
    return (
        <div className="h-full">
            <Sidebar
                className='w-full md:w-56 h-full'
                theme={{
                    root: {
                        inner: "h-full overflow-y-auto overflow-x-hidden rounded bg-gray-50 px-3 py-4 dark:bg-[rgb(32,38,43)] dark:border-b-2 dark:border-gray-700"
                    },
                    item: {
                        base: "flex items-center justify-center rounded-lg p-2 text-sm font-normal text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700",
                        active: "bg-gray-100 dark:bg-gray-700",
                        content: {
                            base: "flex-1 whitespace-nowrap pl-3"
                        },
                    },
                    itemGroup: {
                        base: "mt-2 space-y-2 border-t border-gray-200 pt-2 first:mt-0 first:border-t-0 first:pt-0 dark:border-gray-700"
                    }
                }}
            >
                <Sidebar.Items>
                    <Sidebar.ItemGroup>
                        <Label htmlFor="searchTerm" value="Search Term:" />
                        <form onSubmit={handleSearch} className="m-1">
                            <TextInput
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sizing='sm' placeholder='Search...' id='searchTerm' type='text' rightIcon={AiOutlineSearch}
                            />
                        </form>
                        <Sidebar.Item
                            className="cursor-pointer"
                            icon={TiArrowUnsorted}
                            label={`${order === '' || order === 'desc' ? 'New First' : 'Old First'}`}
                            labelColor="dark"
                            onClick={() => setOrder(order === '' || order === 'desc' ? 'asc' : 'desc')}
                        >
                            Sort
                        </Sidebar.Item>
                        <Sidebar.Collapse
                            icon={BiSolidCategory}
                            label="Tags"
                            renderChevronIcon={(theme, open) => {
                                const IconComponent = open ? HiOutlineMinusSm : HiOutlinePlusSm;
                                return <IconComponent aria-hidden className={twMerge(theme.label.icon.open[open ? 'on' : 'off'])} />;
                            }}
                        >
                            {presetTags.map(({ value, label }) => (
                                <Sidebar.Item
                                    key={value || 'all'}
                                    onClick={() => setTag(value)}
                                    active={tag === value}
                                    className="cursor-pointer"
                                >
                                    {label}
                                </Sidebar.Item>
                            ))}
                        </Sidebar.Collapse>
                    </Sidebar.ItemGroup>
                </Sidebar.Items>
            </Sidebar>
        </div>
    );
}
