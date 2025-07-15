'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { CalendarDaysIcon, XMarkIcon } from '@heroicons/react/24/outline';
import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import clsx from 'clsx';

export function DateRangeFilter() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const { replace } = useRouter();
	
	const dateFrom = searchParams.get('dateFrom') || '';
	const dateTo = searchParams.get('dateTo') || '';

	const [localDateFrom, setLocalDateFrom] = React.useState(dateFrom);
	const [localDateTo, setLocalDateTo] = React.useState(dateTo);

	const hasDateFilter = dateFrom || dateTo;

	function applyDateFilter() {
		const params = new URLSearchParams(searchParams);
		params.set('page', '1');
		
		if (localDateFrom) {
			params.set('dateFrom', localDateFrom);
		} else {
			params.delete('dateFrom');
		}
		
		if (localDateTo) {
			params.set('dateTo', localDateTo);
		} else {
			params.delete('dateTo');
		}

		replace(`${pathname}?${params.toString()}`);
	}

	function clearDateFilter() {
		const params = new URLSearchParams(searchParams);
		params.delete('dateFrom');
		params.delete('dateTo');
		params.set('page', '1');
		
		setLocalDateFrom('');
		setLocalDateTo('');
		
		replace(`${pathname}?${params.toString()}`);
	}

	React.useEffect(() => {
		setLocalDateFrom(dateFrom);
		setLocalDateTo(dateTo);
	}, [dateFrom, dateTo]);

	const getButtonText = () => {
		if (dateFrom && dateTo) {
			return `${dateFrom} - ${dateTo}`;
		} else if (dateFrom) {
			return `From ${dateFrom}`;
		} else if (dateTo) {
			return `To ${dateTo}`;
		}
		return 'Date Range';
	};

	return (
		<Popover.Root>
			<Popover.Trigger asChild>
				<div className={clsx(
					"flex h-10 items-center rounded-lg px-4 text-sm font-medium border transition-colors min-w-[140px] justify-between cursor-pointer",
					hasDateFilter
						? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
						: "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
				)}>
					<div className="flex items-center min-w-0">
						<CalendarDaysIcon className="h-4 w-4 mr-2 flex-shrink-0" />
						<span className="truncate">{getButtonText()}</span>
					</div>
					{hasDateFilter && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								clearDateFilter();
							}}
							className="ml-2 text-blue-600 hover:text-blue-800 flex-shrink-0"
						>
							<XMarkIcon className="h-4 w-4" />
						</button>
					)}
				</div>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					className="bg-white rounded-lg shadow-lg mt-1 p-4 w-72 border border-gray-200 z-50"
					sideOffset={5}
				>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium text-gray-900">Date Range</h3>
							{hasDateFilter && (
								<button
									onClick={clearDateFilter}
									className="text-xs text-blue-600 hover:text-blue-800"
								>
									Clear
								</button>
							)}
						</div>
						
						<div className="space-y-3">
							<div>
								<label className="block text-xs text-gray-500 mb-1">From</label>
								<input
									type="date"
									value={localDateFrom}
									onChange={(e) => setLocalDateFrom(e.target.value)}
									className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label className="block text-xs text-gray-500 mb-1">To</label>
								<input
									type="date"
									value={localDateTo}
									onChange={(e) => setLocalDateTo(e.target.value)}
									className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
						</div>

						<div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
							<Popover.Close className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900">
								Cancel
							</Popover.Close>
							<Popover.Close 
								className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
								onClick={applyDateFilter}
							>
								Apply
							</Popover.Close>
						</div>
					</div>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
