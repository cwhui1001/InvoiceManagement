'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import clsx from 'clsx';

const statuses = [
	{
		value: '',
		label: 'All Status',
	},
	{
		value: 'done',
		label: 'Done',
	},
	{
		value: 'pending',
		label: 'Pending',
	},
];

export function StatusFilter() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const { replace } = useRouter();
	const currentStatus = searchParams.get('status') || '';

	function handleStatusChange(newStatus: string) {
		const params = new URLSearchParams(searchParams);
		params.set('page', '1');
		if (newStatus) {
			params.set('status', newStatus);
		} else {
			params.delete('status');
		}
		replace(`${pathname}?${params.toString()}`);
	}

	const currentStatusLabel = statuses.find(s => s.value === currentStatus)?.label || 'All Status';

	return (
		<Popover.Root>
			<Popover.Trigger className={clsx(
				"flex h-10 items-center rounded-lg px-4 text-sm font-medium border transition-colors min-w-[120px] justify-between",
				currentStatus 
					? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
					: "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
			)}>
				<span className="truncate">{currentStatusLabel}</span>
				<ChevronUpDownIcon className="ml-2 h-4 w-4 flex-shrink-0" />
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					className="bg-white rounded-lg shadow-lg mt-1 p-2 w-48 border border-gray-200 z-50"
					sideOffset={5}
				>
					<div className="flex flex-col">
						{statuses.map((status) => (
							<button
								key={status.value}
								className={clsx(
									'flex items-center px-4 py-2 text-sm rounded-md hover:bg-gray-100',
									status.value === currentStatus && 'bg-blue-50 text-blue-700'
								)}
								onClick={() => {
									handleStatusChange(status.value);
								}}
							>
								<span className="flex-grow text-left">{status.label}</span>
								{status.value === currentStatus && (
									<CheckIcon className="h-4 w-4 text-blue-600" />
								)}
							</button>
						))}
					</div>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
