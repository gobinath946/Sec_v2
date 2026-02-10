const GapOption = require('../models/GapOption');
const exceljs = require('exceljs');

// Get all GAP options
exports.getAllGapOptions = async (req, res) => {
  try {
    const gapOptions = await GapOption.find();
    res.status(200).json({
      success: true,
      count: gapOptions.length,
      data: gapOptions
    });
  } catch (error) {
    console.error('Error fetching GAP options:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get single GAP option
exports.getGapOption = async (req, res) => {
  try {
    const gapOption = await GapOption.findById(req.params.id);
    
    if (!gapOption) {
      return res.status(404).json({
        success: false,
        message: 'GAP option not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: gapOption
    });
  } catch (error) {
    console.error('Error fetching GAP option:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create new GAP option
exports.createGapOption = async (req, res) => {
  try {
    const gapOption = await GapOption.create(req.body);
    
    res.status(201).json({
      success: true,
      data: gapOption
    });
  } catch (error) {
    console.error('Error creating GAP option:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update GAP option
exports.updateGapOption = async (req, res) => {
  try {
    const gapOption = await GapOption.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!gapOption) {
      return res.status(404).json({
        success: false,
        message: 'GAP option not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: gapOption
    });
  } catch (error) {
    console.error('Error updating GAP option:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete GAP option
exports.deleteGapOption = async (req, res) => {
  try {
    const gapOption = await GapOption.findByIdAndDelete(req.params.id);
    
    if (!gapOption) {
      return res.status(404).json({
        success: false,
        message: 'GAP option not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting GAP option:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Generate sample Excel template
exports.generateSampleExcel = async (req, res) => {
  try {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('GAP Options');
    
    // Add headers
    worksheet.columns = [
      { header: 'Option', key: 'option', width: 10 },
      { header: 'Max Benefit', key: 'maxBenefit', width: 15 },
      { header: 'Additional Benefits', key: 'additionalBenefits', width: 20 },
      { header: 'Selling Price', key: 'sellingPrice', width: 15 }
    ];
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    
    // Add sample data or existing data if available
    const existingData = await GapOption.find();
    
    if (existingData.length > 0) {
      existingData.forEach(gap => {
        worksheet.addRow({
          option: gap.option,
          maxBenefit: gap.maxBenefit,
          additionalBenefits: gap.additionalBenefits,
          sellingPrice: gap.sellingPrice
        });
      });
    } else {
      // Add sample data
      worksheet.addRow({ option: 1, maxBenefit: 5000, additionalBenefits: 1000, sellingPrice: 500 });
      worksheet.addRow({ option: 2, maxBenefit: 7500, additionalBenefits: 1500, sellingPrice: 750 });
      worksheet.addRow({ option: 3, maxBenefit: 10000, additionalBenefits: 2000, sellingPrice: 995 });
    }
    
    // Set content type and disposition
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=gap_options_template.xlsx');
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel template:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Import from Excel
exports.importFromExcel = async (req, res) => {
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
    
    // Validate and extract data
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const option = parseInt(row.getCell(1).value);
      const maxBenefit = parseFloat(row.getCell(2).value);
      const additionalBenefits = parseFloat(row.getCell(3).value);
      const sellingPrice = parseFloat(row.getCell(4).value);
      
      // Validate data
      if (isNaN(option) || isNaN(maxBenefit) || isNaN(additionalBenefits) || isNaN(sellingPrice)) {
        errors.push(`Row ${rowNumber}: Contains invalid numeric data`);
      } else {
        importData.push({
          option,
          maxBenefit,
          additionalBenefits,
          sellingPrice
        });
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors in Excel data',
        errors
      });
    }
    
    // Preview data to client
    res.status(200).json({
      success: true,
      message: 'Excel data validated successfully',
      data: importData
    });
    
  } catch (error) {
    console.error('Error importing from Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Excel import'
    });
  }
};

// Save imported Excel data to database
exports.saveImportedData = async (req, res) => {
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
      await GapOption.deleteMany({});
      const insertedData = await GapOption.insertMany(data);
      
      return res.status(201).json({
        success: true,
        message: 'All GAP options replaced successfully',
        count: insertedData.length
      });
    } else {
      // Update existing records or insert new ones
      const operations = data.map(item => ({
        updateOne: {
          filter: { option: item.option },
          update: { $set: item },
          upsert: true
        }
      }));
      
      const result = await GapOption.bulkWrite(operations);
      
      return res.status(200).json({
        success: true,
        message: 'GAP options updated successfully',
        modified: result.modifiedCount,
        inserted: result.upsertedCount
      });
    }
  } catch (error) {
    console.error('Error saving imported data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during data save'
    });
  }
};
