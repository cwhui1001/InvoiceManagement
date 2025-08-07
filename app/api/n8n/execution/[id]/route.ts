import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const executionId = id;

    if (!process.env.N8N_URL || !process.env.N8N_API_KEY) {
      return NextResponse.json(
        { error: 'N8N configuration missing' },
        { status: 500 }
      );
    }

    console.log(`Fetching n8n execution ${executionId} from ${process.env.N8N_URL}`); // Debug log

    const response = await fetch(`${process.env.N8N_URL}/api/v1/executions/${executionId}`, {
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`n8n API response status: ${response.status}`); // Debug log

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`n8n API error:`, errorText); // Debug log
      return NextResponse.json(
        { error: `n8n API error: ${response.status}` },
        { status: response.status }
      );
    }

    const execution = await response.json();
    console.log(`n8n execution data:`, {
      id: execution.id,
      status: execution.status,
      finished: execution.finished,
      success: execution.success,
      startedAt: execution.startedAt,
      stoppedAt: execution.stoppedAt
    }); // Debug log

    return NextResponse.json({
      id: execution.id,
      status: execution.status,
      finished: execution.finished || execution.status === 'success' || execution.status === 'error',
      success: execution.status === 'success',
      startedAt: execution.startedAt,
      stoppedAt: execution.stoppedAt,
      createdAt: execution.createdAt,
      error: execution.status === 'error' ? execution.data?.resultData?.error?.message || 'Execution failed' : undefined
    });

  } catch (error) {
    console.error('Error fetching n8n execution:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
