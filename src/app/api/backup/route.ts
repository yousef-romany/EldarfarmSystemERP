import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getSession();
  
  // Only allow admins to create backups
  if (!session.isLoggedIn || !session.user || 
      (session.user.role !== 'DEVELOPER' && session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      // Create backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `backup-${timestamp}.sql`;
      
      // Get database URL from environment
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 });
      }

      // Parse database URL to get connection details
      const url = new URL(databaseUrl);
      const dbHost = url.hostname;
      const dbPort = url.port || '3306';
      const dbUser = url.username;
      const dbPassword = url.password;
      const dbName = url.pathname.substring(1);

      // Create mysqldump command
      const mysqldumpCommand = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} ${dbName} > /tmp/${backupFilename}`;

      try {
        await execAsync(mysqldumpCommand);
        
        // Read the backup file
        const fs = require('fs').promises;
        const backupContent = await fs.readFile(`/tmp/${backupFilename}`, 'utf-8');
        
        // Delete the temporary file
        await fs.unlink(`/tmp/${backupFilename}`);

        return NextResponse.json({
          success: true,
          filename: backupFilename,
          content: backupContent,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Backup creation error:', error);
        return NextResponse.json({ 
          error: 'Failed to create backup. Make sure mysqldump is installed and configured.' 
        }, { status: 500 });
      }
    }

    if (action === 'restore') {
      // Restore from backup
      const { content } = body;
      
      if (!content) {
        return NextResponse.json({ error: 'Backup content is required' }, { status: 400 });
      }

      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 });
      }

      // Parse database URL to get connection details
      const url = new URL(databaseUrl);
      const dbHost = url.hostname;
      const dbPort = url.port || '3306';
      const dbUser = url.username;
      const dbPassword = url.password;
      const dbName = url.pathname.substring(1);

      // Save backup content to temporary file
      const fs = require('fs').promises;
      const tempFilename = `/tmp/restore-${Date.now()}.sql`;
      await fs.writeFile(tempFilename, content, 'utf-8');

      // Create mysql restore command
      const mysqlCommand = `mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} ${dbName} < ${tempFilename}`;

      try {
        await execAsync(mysqlCommand);
        
        // Delete the temporary file
        await fs.unlink(tempFilename);

        return NextResponse.json({
          success: true,
          message: 'Database restored successfully',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Restore error:', error);
        // Clean up temp file on error
        try {
          await fs.unlink(tempFilename);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
        return NextResponse.json({ 
          error: 'Failed to restore database. Make sure mysql client is installed and configured.' 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Backup API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  
  // Only allow admins to list backups
  if (!session.isLoggedIn || !session.user || 
      (session.user.role !== 'DEVELOPER' && session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // List available backups from /tmp directory
    const fs = require('fs').promises;
    const files = await fs.readdir('/tmp');
    const backupFiles = files.filter((file: string) =>
      file.startsWith('backup-') && file.endsWith('.sql')
    );
    
    const backups = await Promise.all(
      backupFiles.map(async (file: string) => {
        const stats = await fs.stat(`/tmp/${file}`);
        return {
          filename: file,
          size: stats.size,
          created: stats.mtime,
        };
      })
    );

    // Sort by creation date (newest first)
    backups.sort((a: any, b: any) => b.created - a.created);

    return NextResponse.json({ backups });
  } catch (error: any) {
    console.error('List backups error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
