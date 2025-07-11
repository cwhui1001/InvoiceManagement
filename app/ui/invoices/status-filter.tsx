'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import clsx from 'clsx';

const statuses = [
	{
		value: '',
		label: 'All',
	},
	{
		value: 'paid',
		label: 'Paid',
	},
	{
		value: 'pending',
		label: 'Pending',
	},
];

export function InvoiceStatusFilter() {
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

	return (
		<Popover.Root>
			<Popover.Trigger className="flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 focus:outline-none">
				<span>Status</span>
				<ChevronUpDownIcon className="ml-2 h-5 w-5" />
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					className="bg-white rounded-lg shadow-lg mt-1 p-2 w-48"
					sideOffset={5}
				>
					<div className="flex flex-col">
						{statuses.map((status) => (
							<button
								key={status.value}
								className={clsx(
									'flex items-center px-4 py-2 text-sm rounded-md hover:bg-gray-100',
									status.value === currentStatus && 'bg-gray-100'
								)}
								onClick={() => {
									handleStatusChange(status.value);
								}}
							>
								<span className="flex-grow">{status.label}</span>
								{status.value === currentStatus && (
									<CheckIcon className="h-4 w-4" />
								)}
							</button>
						))}
					</div>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
