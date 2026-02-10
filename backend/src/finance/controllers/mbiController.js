const MbiOption = require("../models/MbiOption");
const exceljs = require("exceljs");

// MBI Options CRUD
exports.getAllMbiOptions = async (req, res) => {
  try {
    const options = await MbiOption.find();
    res.status(200).json({
      success: true,
      count: options.length,
      data: options,
    });
  } catch (error) {
    console.error("Error fetching MBI options:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getMbiOption = async (req, res) => {
  try {
    const mbiOption = await MbiOption.findById(req.params.id);

    if (!mbiOption) {
      return res.status(404).json({
        success: false,
        message: "MBI option not found",
      });
    }

    res.status(200).json({
      success: true,
      data: mbiOption,
    });
  } catch (error) {
    console.error("Error fetching MBI option:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.createMbiOption = async (req, res) => {
  try {
    const mbiOption = await MbiOption.create(req.body);

    res.status(201).json({
      success: true,
      data: mbiOption,
    });
  } catch (error) {
    console.error("Error creating MBI option:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.updateMbiOption = async (req, res) => {
  try {
    const mbiOption = await MbiOption.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!mbiOption) {
      return res.status(404).json({
        success: false,
        message: "MBI option not found",
      });
    }

    res.status(200).json({
      success: true,
      data: mbiOption,
    });
  } catch (error) {
    console.error("Error updating MBI option:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.deleteMbiOption = async (req, res) => {
  try {
    const mbiOption = await MbiOption.findByIdAndDelete(req.params.id);

    if (!mbiOption) {
      return res.status(404).json({
        success: false,
        message: "MBI option not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Error deleting MBI option:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Generate sample Excel template for MBI Options
exports.generateMbiOptionsSampleExcel = async (req, res) => {
  try {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("MBI Options");

    // Add headers
    worksheet.columns = [
      { header: "Type", key: "type", width: 15 },
      { header: "Is Electric", key: "isElectric", width: 10 },
      { header: "Max Age", key: "maxAge", width: 10 },
      { header: "Option", key: "option", width: 10 },
      { header: "Max Kms", key: "maxKms", width: 10 },
      { header: "Excess", key: "excess", width: 10 },
      { header: "Term", key: "term", width: 10 },
      { header: "Claim Limit", key: "claimLimit", width: 15 },
      { header: "Premium", key: "premium", width: 10 },
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };

    // Add sample data or existing data if available
    const existingData = await MbiOption.find();

    if (existingData.length > 0) {
      existingData.forEach((option) => {
        worksheet.addRow({
          type: option.type,
          isElectric: option.isElectric,
          maxAge: option.maxAge,
          option: option.option,
          maxKms: option.maxKms,
          excess: option.excess,
          term: option.term,
          claimLimit: option.claimLimit,
          premium: option.premium,
        });
      });
    } else {
      // Add sample data
      worksheet.addRow({
        type: "Smart Cover",
        isElectric: false,
        maxAge: 10,
        option: 1,
        maxKms: 150000,
        excess: 100,
        term: 36,
        claimLimit: "$7,500",
        premium: 1295,
      });
      worksheet.addRow({
        type: "Extreme Plus",
        isElectric: true,
        maxAge: 5,
        option: 2,
        maxKms: 100000,
        excess: 200,
        term: 24,
        claimLimit: "$10,000",
        premium: 1495,
      });
    }

    // Set content type and disposition
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=mbi_options_template.xlsx"
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating MBI options Excel template:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Import MBI options from Excel

exports.importMbiOptionsFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an Excel file",
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

      try {
        const type = String(row.getCell(1).value);
        const isElectric = Boolean(
          row.getCell(2).value === "true" || row.getCell(2).value === true
        );

        const maxAge = parseInt(row.getCell(3).value);
        const option = parseInt(row.getCell(4).value);
        const maxKms = parseInt(row.getCell(5).value);
        const excess = parseInt(row.getCell(6).value);
        const term = parseInt(row.getCell(7).value);
        const claimLimit = String(row.getCell(8).value);

        // Handle premium with formula fallback
        const premiumCell = row.getCell(9);
        const rawPremium = parseFloat(premiumCell.result ?? premiumCell.value);
        let premium = parseFloat(rawPremium);

        if (!isNaN(premium)) {
          premium = parseFloat(premium.toFixed(2)); // Limit to 2 decimal places
        }
        const rowErrors = [];

        if (isNaN(maxAge)) rowErrors.push("maxAge");
        if (isNaN(option)) rowErrors.push("option");
        if (isNaN(maxKms)) rowErrors.push("maxKms");
        if (isNaN(excess)) rowErrors.push("excess");
        if (isNaN(term)) rowErrors.push("term");
        if (isNaN(premium)) rowErrors.push("premium");

        if (rowErrors.length > 0) {
          errors.push(
            `Row ${rowNumber}: Invalid numeric value(s) in field(s): ${rowErrors.join(
              ", "
            )}`
          );
        } else {
          importData.push({
            type,
            isElectric,
            maxAge,
            option,
            maxKms,
            excess,
            term,
            claimLimit,
            premium,
          });
        }
      } catch (err) {
        errors.push(`Row ${rowNumber}: ${err.message}`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation errors in Excel data",
        errors,
      });
    }

    // Preview data to client
    res.status(200).json({
      success: true,
      message: "Excel data validated successfully",
      data: importData,
    });
  } catch (error) {
    console.error("Error importing MBI options from Excel:", error);
    res.status(500).json({
      success: false,
      message: "Server error during Excel import",
    });
  }
};

// Save imported MBI options Excel data to database
exports.saveMbiOptionsImportedData = async (req, res) => {
  try {
    const { data, replaceAll } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid data provided",
      });
    }

    if (replaceAll) {
      // Delete all existing records and insert new ones
      await MbiOption.deleteMany({});
      const insertedData = await MbiOption.insertMany(data);

      return res.status(201).json({
        success: true,
        message: "All MBI options replaced successfully",
        count: insertedData.length,
      });
    } else {
      // Update existing records or insert new ones based on combined key
      const operations = data.map((item) => ({
        updateOne: {
          filter: {
            type: item.type,
            isElectric: item.isElectric,
            excess: item.excess,
            term: item.term,
            option: item.option,
          },
          update: { $set: item },
          upsert: true,
        },
      }));

      const result = await MbiOption.bulkWrite(operations);

      return res.status(200).json({
        success: true,
        message: "MBI options updated successfully",
        modified: result.modifiedCount,
        inserted: result.upsertedCount,
      });
    }
  } catch (error) {
    console.error("Error saving imported MBI options data:", error);
    res.status(500).json({
      success: false,
      message: "Server error during data save",
    });
  }
};
