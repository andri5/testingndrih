const { jsPDF } = require('jspdf');
const { autoTable } = require('jspdf-autotable');

class ReportService {
  generateJSON(execution) {
    return {
      execution: {
        id: execution.id,
        testCase: execution.testCase?.name,
        type: execution.testCase?.type,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        duration: execution.duration,
        totalSteps: execution.totalSteps,
        passedSteps: execution.passedSteps,
        failedSteps: execution.failedSteps,
        executedBy: execution.executor?.name,
      },
      results: execution.testResults?.map((result) => ({
        stepIndex: result.stepIndex,
        stepName: result.stepName,
        status: result.passed ? 'PASSED' : 'FAILED',
        executionTime: result.executionTime,
        errorMessage: result.errorMessage,
      })) || [],
    };
  }

  generateCSV(execution) {
    let csv = 'Test Execution Report\n';
    csv += `Test Case,${execution.testCase?.name}\n`;
    csv += `Type,${execution.testCase?.type}\n`;
    csv += `Status,${execution.status}\n`;
    csv += `Duration,${execution.duration}ms\n`;
    csv += `Passed Steps,${execution.passedSteps}\n`;
    csv += `Failed Steps,${execution.failedSteps}\n`;
    csv += `Executed By,${execution.executor?.name}\n`;
    csv += `Started At,${new Date(execution.startTime).toLocaleString()}\n\n`;

    csv += 'Step Results\n';
    csv += 'Step,Name,Status,Duration (ms),Error Message\n';

    execution.testResults?.forEach((result) => {
      const status = result.passed ? 'PASSED' : 'FAILED';
      const errorMsg = result.errorMessage ? `"${result.errorMessage}"` : '';
      csv += `${result.stepIndex + 1},${result.stepName},${status},${result.executionTime},${errorMsg}\n`;
    });

    return csv;
  }

  generatePDF(execution) {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.text('Test Execution Report', 14, 22);

    // Summary Section
    doc.setFontSize(12);
    doc.text('Summary', 14, 32);

    const summaryData = [
      ['Test Case', execution.testCase?.name || 'N/A'],
      ['Type', execution.testCase?.type || 'N/A'],
      ['Status', execution.status.toUpperCase()],
      ['Duration', `${execution.duration}ms`],
      ['Passed Steps', execution.passedSteps],
      ['Failed Steps', execution.failedSteps],
      ['Executed By', execution.executor?.name || 'N/A'],
      ['Started At', new Date(execution.startTime).toLocaleString()],
      ['Ended At', new Date(execution.endTime).toLocaleString()],
    ];

    autoTable(doc, {
      startY: 38,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    // Results Section
    let resultsY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Step Results', 14, resultsY);

    const resultsData = execution.testResults?.map((result) => [
      result.stepIndex + 1,
      result.stepName,
      result.passed ? '✓ PASSED' : '✗ FAILED',
      `${result.executionTime}ms`,
      result.errorMessage || '-',
    ]) || [];

    autoTable(doc, {
      startY: resultsY + 6,
      head: [['Step', 'Name', 'Status', 'Duration', 'Error']],
      body: resultsData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      didDrawPage: (data) => {
        // Footer
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(10);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      },
    });

    return doc;
  }
}

module.exports = new ReportService();
