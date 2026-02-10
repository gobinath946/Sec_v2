
const PpiRate = require('../models/PpiRate');
const exceljs = require('exceljs');

// PPI Rates CRUD
exports.getAllPpiRates = async (req, res) => {
  try {
    const ppiRates = await PpiRate.find();
    res.status(200).json({
      success: true,
      count: ppiRates.length,
      data: ppiRates
    });
  } catch (error) {
    console.error('Error fetching PPI rates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getPpiRate = async (req, res) => {
  try {
    const ppiRate = await PpiRate.findById(req.params.id);
    
    if (!ppiRate) {
      return res.status(404).json({
        success: false,
        message: 'PPI rate not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: ppiRate
    });
  } catch (error) {
    console.error('Error fetching PPI rate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.createPpiRate = async (req, res) => {
  try {
    const ppiRate = await PpiRate.create(req.body);
    
    res.status(201).json({
      success: true,
      data: ppiRate
    });
  } catch (error) {
    console.error('Error creating PPI rate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.updatePpiRate = async (req, res) => {
  try {
    const ppiRate = await PpiRate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!ppiRate) {
      return res.status(404).json({
        success: false,
        message: 'PPI rate not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: ppiRate
    });
  } catch (error) {
    console.error('Error updating PPI rate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.deletePpiRate = async (req, res) => {
  try {
    const ppiRate = await PpiRate.findByIdAndDelete(req.params.id);
    
    if (!ppiRate) {
      return res.status(404).json({
        success: false,
        message: 'PPI rate not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting PPI rate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Generate sample Excel template for PPI Rates
exports.generatePpiRatesSampleExcel = async (req, res) => {
  try {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('PPI Rates');
    
    // Add headers
    worksheet.columns = [
      { header: 'Term (months)', key: 'term', width: 15 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Premium (%)', key: 'premium', width: 15 }
    ];
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    
    // Add sample data or existing data if available
    const existingData = await PpiRate.find();
    
    if (existingData.length > 0) {
      existingData.forEach(rate => {
        worksheet.addRow({
          term: rate.term,
          type: rate.type,
          status: rate.status,
          premium: rate.premium
        });
      });
    } else {
      // Add sample data
      worksheet.addRow({ term: 60, type: 'Single', status: 'Employed', premium: 5.23 });
      worksheet.addRow({ term: 60, type: 'Single', status: 'Self Employed', premium: 7.12 });
      worksheet.addRow({ term: 60, type: 'Double', status: 'Employed', premium: 8.45 });
    }
    
    // Set content type and disposition
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ppi_rates_template.xlsx');
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating PPI rates Excel template:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


exports.importPpiRatesFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file'
      });
    }

    const workbook = new exceljs.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);
    const importData = [];
    const errors = [];

    // Define allowed values
    const allowedTypes = ['Single', 'Double'];
    const allowedStatuses = ['Employed', 'Self Employed', 'Everyday Essentials'];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      try {
        // Parse and clean values
        const term = parseInt(row.getCell(1).value);
        const rawType = String(row.getCell(2).text || row.getCell(2).value);
        const type = rawType.replace(/\s+/g, ' ').trim();

        const rawStatus = String(row.getCell(3).text || row.getCell(3).value);
        const status = rawStatus.replace(/\s+/g, ' ').trim();

        const premium = parseFloat(parseFloat(row.getCell(4).value).toFixed(2));

        // Validate data
        if (isNaN(term)) {
          errors.push(`Row ${rowNumber}: Invalid term (must be a number)`);
        } else if (isNaN(premium)) {
          errors.push(`Row ${rowNumber}: Invalid premium (must be a number)`);
        } else if (!allowedTypes.includes(type)) {
          errors.push(`Row ${rowNumber}: Invalid type '${type}' (must be 'Single' or 'Double')`);
        } else if (!allowedStatuses.includes(status)) {
          errors.push(`Row ${rowNumber}: Invalid status '${status}' (must be one of ${allowedStatuses.join(', ')})`);
        } else {
          importData.push({
            term,
            type,
            status,
            premium
          });
        }

      } catch (err) {
        errors.push(`Row ${rowNumber}: ${err.message}`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors in Excel data',
        errors
      });
    }

    // Preview validated data
    return res.status(200).json({
      success: true,
      message: 'Excel data validated successfully',
      data: importData
    });

  } catch (error) {
    console.error('Error importing PPI rates from Excel:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during Excel import'
    });
  }
};


// Save imported PPI Rates Excel data to database
exports.savePpiRatesImportedData = async (req, res) => {
  try {
    const { data, replaceAll } = req.body;
    
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid data provided'
      });
    }
    
    if (replaceAll) {
      // Delete all existing records and insert new ones
      await PpiRate.deleteMany({});
      const insertedData = await PpiRate.insertMany(data);
      
      return res.status(201).json({
        success: true,
        message: 'All PPI rates replaced successfully',
        count: insertedData.length
      });
    } else {
      // Update existing records or insert new ones based on combined key
      const operations = data.map(item => ({
        updateOne: {
          filter: { 
            term: item.term,
            type: item.type,
            status: item.status
          },
          update: { $set: item },
          upsert: true
        }
      }));
      
      const result = await PpiRate.bulkWrite(operations);
      
      return res.status(200).json({
        success: true,
        message: 'PPI rates updated successfully',
        modified: result.modifiedCount,
        inserted: result.upsertedCount
      });
    }
  } catch (error) {
    console.error('Error saving imported PPI rates data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during data save'
    });
  }
};
