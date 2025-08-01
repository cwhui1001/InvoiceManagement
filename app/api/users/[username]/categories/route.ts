import { NextRequest, NextResponse } from 'next/server';
import { fetchUserCategoryTotals } from '@/app/lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const categoryData = await fetchUserCategoryTotals(username);
    
    return NextResponse.json(categoryData);
  } catch (error) {
    console.error('Error fetching user category data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user category data' },
      { status: 500 }
    );
  }
}
