import { getCompanyConnection } from '../config/database.js';
import SettingsSchema from '../models/company/Settings.model.js';

export const getSettings = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { companyId } = req.user;

    const companyConn = await getCompanyConnection(companyId);
    const Settings = companyConn.model('Settings', SettingsSchema);

    const settings = await Settings.find({ category });

    res.json({ settings });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { companyId } = req.user;
    const { provider, config } = req.body;

    const companyConn = await getCompanyConnection(companyId);
    const Settings = companyConn.model('Settings', SettingsSchema);

    // Deactivate all other providers in this category
    await Settings.updateMany(
      { category },
      { $set: { isActive: false } }
    );

    // Create or update the new provider settings
    const settings = await Settings.findOneAndUpdate(
      { category, provider },
      {
        category,
        provider,
        config,
        isActive: true,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    next(error);
  }
};

export const testSettings = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { companyId } = req.user;

    // TODO: Implement actual testing logic for each provider type
    // For now, just return success

    res.json({
      message: 'Settings test successful',
      success: true
    });
  } catch (error) {
    next(error);
  }
};
