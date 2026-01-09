import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { PerformanceMonitor } from '@/lib/performance';

/**
 * API endpoint to view performance metrics
 * Only accessible to users with developer or admin role
 */
export async function GET(request: Request) {
  const session = await getSession();
  
  // Only allow developers and admins to view performance metrics
  if (!session.isLoggedIn || 
      (session.user?.role !== 'DEVELOPER' && session.user?.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const metrics = PerformanceMonitor.getAllMetrics();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (error) {
    console.error('Failed to fetch performance metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch performance metrics' }, { status: 500 });
  }
}

/**
 * Clear performance metrics
 * Only accessible to developers
 */
export async function DELETE(request: Request) {
  const session = await getSession();
  
  // Only allow developers to clear metrics
  if (!session.isLoggedIn || session.user?.role !== 'DEVELOPER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    PerformanceMonitor.clearMetrics();
    
    return NextResponse.json({ 
      success: true,
      message: 'Performance metrics cleared successfully' 
    });
  } catch (error) {
    console.error('Failed to clear performance metrics:', error);
    return NextResponse.json({ error: 'Failed to clear performance metrics' }, { status: 500 });
  }
}
