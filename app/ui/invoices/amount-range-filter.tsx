'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { CurrencyDollarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import clsx from 'clsx';

export function AmountRangeFilter() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const { replace } = useRouter();
	
	const amountMin = searchParams.get('amountMin') || '';
	const amountMax = searchParams.get('amountMax') || '';

	const [localAmountMin, setLocalAmountMin] = React.useState(amountMin);
	const [localAmountMax, setLocalAmountMax] = React.useState(amountMax);

	const hasAmountFilter = amountMin || amountMax;

	function applyAmountFilter() {
		const params = new URLSearchParams(searchParams);
		params.set('page', '1');
		
		if (localAmountMin) {
			params.set('amountMin', localAmountMin);
		} else {
			params.delete('amountMin');
		}
		
		if (localAmountMax) {
			params.set('amountMax', localAmountMax);
		} else {
			params.delete('amountMax');
		}

		replace(`${pathname}?${params.toString()}`);
	}

	function clearAmountFilter() {
		const params = new URLSearchParams(searchParams);
		params.delete('amountMin');
		params.delete('amountMax');
		params.set('page', '1');
		
		setLocalAmountMin('');
		setLocalAmountMax('');
		
		replace(`${pathname}?${params.toString()}`);
	}

	React.useEffect(() => {
		setLocalAmountMin(amountMin);
		setLocalAmountMax(amountMax);
	}, [amountMin, amountMax]);

	const getButtonText = () => {
		if (amountMin && amountMax) {
			return `$${amountMin} - $${amountMax}`;
		} else if (amountMin) {
			return `Min $${amountMin}`;
		} else if (amountMax) {
			return `Max $${amountMax}`;
		}
		return 'Amount Range';
	};

	return (
		<Popover.Root>
			<Popover.Trigger asChild>
				<div className={clsx(
					"flex h-10 items-center rounded-lg px-4 text-sm font-medium border transition-colors min-w-[140px] justify-between cursor-pointer",
					hasAmountFilter
						? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
						: "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
				)}>
					<div className="flex items-center min-w-0">
						<CurrencyDollarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
						<span className="truncate">{getButtonText()}</span>
					</div>
					{hasAmountFilter && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								clearAmountFilter();
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
							<h3 className="text-sm font-medium text-gray-900">Amount Range</h3>
							{hasAmountFilter && (
								<button
									onClick={clearAmountFilter}
									className="text-xs text-blue-600 hover:text-blue-800"
								>
									Clear
								</button>
							)}
						</div>
						
						<div className="space-y-3">
							<div>
								<label className="block text-xs text-gray-500 mb-1">Min Amount</label>
								<input
									type="number"
									placeholder="0.00"
									value={localAmountMin}
									onChange={(e) => setLocalAmountMin(e.target.value)}
									className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label className="block text-xs text-gray-500 mb-1">Max Amount</label>
								<input
									type="number"
									placeholder="999999.99"
									value={localAmountMax}
									onChange={(e) => setLocalAmountMax(e.target.value)}
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
								onClick={applyAmountFilter}
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
