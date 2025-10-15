import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { Admin } from '../auth/admin.decorator';
import { TimeEntriesService } from './time-entries.service';

@Controller('time-entries')
@UseGuards(JwtAuthGuard)
export class TimeEntriesController {
  constructor(private timeEntriesService: TimeEntriesService) {}

  @Get('export-csv')
  @Admin()
  @UseGuards(AdminGuard)
  async exportCsv(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('projectId') projectId: string,
    @Res() res: Response,
  ) {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (!monthNum || !yearNum || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid month or year' });
    }

    try {
      const csvData = await this.timeEntriesService.generateFullReportCsv(
        yearNum,
        monthNum,
        projectId || undefined,
      );

      const filename = `timesheet-report-${monthNum}-${yearNum}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.setHeader('Cache-Control', 'no-cache');

      return res.send(csvData);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to generate CSV report' });
    }
  }
}
