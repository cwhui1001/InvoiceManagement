'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { CheckIcon, ChevronUpDownIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
		label: 'Done',
	},
	{
		value: 'pending',
		label: 'Pending',
	},
];

export function InvoiceAdvancedFilter() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const { replace } = useRouter();
	
	const currentStatus = searchParams.get('status') || '';
	const dateFrom = searchParams.get('dateFrom') || '';
	const dateTo = searchParams.get('dateTo') || '';
	const amountMin = searchParams.get('amountMin') || '';
	const amountMax = searchParams.get('amountMax') || '';

	const [filters, setFilters] = React.useState({
		status: currentStatus,
		dateFrom,
		dateTo,
		amountMin,
		amountMax,
	});

	const hasActiveFilters = currentStatus || dateFrom || dateTo || amountMin || amountMax;

	function applyFilters() {
		const params = new URLSearchParams(searchParams);
		params.set('page', '1');
		
		// Apply all filters
		Object.entries(filters).forEach(([key, value]) => {
			if (value && value.trim()) {
				params.set(key, value);
			} else {
				params.delete(key);
			}
		});

		replace(`${pathname}?${params.toString()}`);
	}

	function clearAllFilters() {
		const params = new URLSearchParams(searchParams);
		params.delete('status');
		params.delete('dateFrom');
		params.delete('dateTo');
		params.delete('amountMin');
		params.delete('amountMax');
		params.set('page', '1');
		
		setFilters({
			status: '',
			dateFrom: '',
			dateTo: '',
			amountMin: '',
			amountMax: '',
		});

		replace(`${pathname}?${params.toString()}`);
	}

	React.useEffect(() => {
		setFilters({
			status: currentStatus,
			dateFrom,
			dateTo,
			amountMin,
			amountMax,
		});
	}, [currentStatus, dateFrom, dateTo, amountMin, amountMax]);

	return (
		<div className="flex items-center gap-2">
			<Popover.Root>
				<Popover.Trigger className={clsx(
					"flex h-10 items-center rounded-lg px-4 text-sm font-medium border transition-colors",
					hasActiveFilters 
						? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
						: "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
				)}>
					<FunnelIcon className="mr-2 h-4 w-4" />
					<span>Filters</span>
					{hasActiveFilters && (
						<span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
							{Object.values(filters).filter(Boolean).length}
						</span>
					)}
					<ChevronUpDownIcon className="ml-2 h-4 w-4" />
				</Popover.Trigger>
				<Popover.Portal>
					<Popover.Content
						className="bg-white rounded-lg shadow-lg mt-1 p-4 w-80 border border-gray-200"
						sideOffset={5}
					>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-medium text-gray-900">Filter Invoices</h3>
								{hasActiveFilters && (
									<button
										onClick={clearAllFilters}
										className="text-xs text-blue-600 hover:text-blue-800"
									>
										Clear all
									</button>
								)}
							</div>

							{/* Status Filter */}
							<div>
								<label className="block text-xs font-medium text-gray-700 mb-2">
									Status
								</label>
								<div className="space-y-1">
									{statuses.map((status) => (
										<button
											key={status.value}
											className={clsx(
												'flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100',
												status.value === filters.status && 'bg-blue-50 text-blue-700'
											)}
											onClick={() => {
												setFilters(prev => ({ ...prev, status: status.value }));
											}}
										>
											<span className="flex-grow text-left">{status.label}</span>
											{status.value === filters.status && (
												<CheckIcon className="h-4 w-4 text-blue-600" />
											)}
										</button>
									))}
								</div>
							</div>

							{/* Date Range Filter */}
							<div>
								<label className="block text-xs font-medium text-gray-700 mb-2">
									Date Range
								</label>
								<div className="space-y-2">
									<div>
										<label className="block text-xs text-gray-500 mb-1">From</label>
										<input
											type="date"
											value={filters.dateFrom}
											onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
											className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div>
										<label className="block text-xs text-gray-500 mb-1">To</label>
										<input
											type="date"
											value={filters.dateTo}
											onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
											className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>
							</div>

							{/* Amount Range Filter */}
							<div>
								<label className="block text-xs font-medium text-gray-700 mb-2">
									Amount Range
								</label>
								<div className="space-y-2">
									<div>
										<label className="block text-xs text-gray-500 mb-1">Min Amount</label>
										<input
											type="number"
											placeholder="0.00"
											value={filters.amountMin}
											onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
											className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
									<div>
										<label className="block text-xs text-gray-500 mb-1">Max Amount</label>
										<input
											type="number"
											placeholder="999999.99"
											value={filters.amountMax}
											onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
											className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>
							</div>

							{/* Apply Button */}
							<div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
								<Popover.Close className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900">
									Cancel
								</Popover.Close>
								<Popover.Close 
									className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
									onClick={applyFilters}
								>
									Apply Filters
								</Popover.Close>
							</div>
						</div>
					</Popover.Content>
				</Popover.Portal>
			</Popover.Root>

			{/* Active Filters Display */}
			{hasActiveFilters && (
				<div className="flex items-center gap-1 flex-wrap">
					{currentStatus && (
						<span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
							Status: {statuses.find(s => s.value === currentStatus)?.label}
							<button
								onClick={() => {
									const params = new URLSearchParams(searchParams);
									params.delete('status');
									params.set('page', '1');
									replace(`${pathname}?${params.toString()}`);
								}}
								className="ml-1 text-blue-600 hover:text-blue-800"
							>
								<XMarkIcon className="h-3 w-3" />
							</button>
						</span>
					)}
					{dateFrom && (
						<span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
							From: {dateFrom}
							<button
								onClick={() => {
									const params = new URLSearchParams(searchParams);
									params.delete('dateFrom');
									params.set('page', '1');
									replace(`${pathname}?${params.toString()}`);
								}}
								className="ml-1 text-blue-600 hover:text-blue-800"
							>
								<XMarkIcon className="h-3 w-3" />
							</button>
						</span>
					)}
					{dateTo && (
						<span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
							To: {dateTo}
							<button
								onClick={() => {
									const params = new URLSearchParams(searchParams);
									params.delete('dateTo');
									params.set('page', '1');
									replace(`${pathname}?${params.toString()}`);
								}}
								className="ml-1 text-blue-600 hover:text-blue-800"
							>
								<XMarkIcon className="h-3 w-3" />
							</button>
						</span>
					)}
					{amountMin && (
						<span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
							Min: ${amountMin}
							<button
								onClick={() => {
									const params = new URLSearchParams(searchParams);
									params.delete('amountMin');
									params.set('page', '1');
									replace(`${pathname}?${params.toString()}`);
								}}
								className="ml-1 text-blue-600 hover:text-blue-800"
							>
								<XMarkIcon className="h-3 w-3" />
							</button>
						</span>
					)}
					{amountMax && (
						<span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
							Max: ${amountMax}
							<button
								onClick={() => {
									const params = new URLSearchParams(searchParams);
									params.delete('amountMax');
									params.set('page', '1');
									replace(`${pathname}?${params.toString()}`);
								}}
								className="ml-1 text-blue-600 hover:text-blue-800"
							>
								<XMarkIcon className="h-3 w-3" />
							</button>
						</span>
					)}
				</div>
			)}
		</div>
	);
}
