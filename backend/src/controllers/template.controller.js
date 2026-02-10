import { getCompanyConnection } from '../config/database.js';
import TemplateSchema from '../models/company/Template.model.js';

export const listTemplates = async (req, res, next) => {
  try {
    const { companyId, userId } = req.user;
    
    const companyConn = await getCompanyConnection(companyId);
    const Template = companyConn.model('Template', TemplateSchema);

    const templates = await Template.find({ isActive: true })
      .select('name description createdAt updatedAt version')
      .sort({ createdAt: -1 });

    res.json({
      templates: templates.map(template => ({
        id: template._id,
        name: template.name,
        description: template.description,
        version: template.version,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const getTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const companyConn = await getCompanyConnection(companyId);
    const Template = companyConn.model('Template', TemplateSchema);

    const template = await Template.findOne({ _id: id, isActive: true });
    if (!template) {
      return res.status(404).json({
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json({ template });
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const { companyId, userId } = req.user;
    const templateData = req.body;

    const companyConn = await getCompanyConnection(companyId);
    const Template = companyConn.model('Template', TemplateSchema);

    const template = new Template({
      ...templateData,
      createdBy: userId
    });

    await template.save();

    res.status(201).json({
      message: 'Template created successfully',
      template: {
        id: template._id,
        name: template.name,
        version: template.version
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId, userId } = req.user;
    const updateData = req.body;

    const companyConn = await getCompanyConnection(companyId);
    const Template = companyConn.model('Template', TemplateSchema);

    const existingTemplate = await Template.findOne({ _id: id, isActive: true });
    if (!existingTemplate) {
      return res.status(404).json({
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Create new version
    const newTemplate = new Template({
      ...existingTemplate.toObject(),
      ...updateData,
      _id: undefined,
      version: existingTemplate.version + 1,
      previousVersionId: existingTemplate._id,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newTemplate.save();

    // Optionally deactivate old version
    // existingTemplate.isActive = false;
    // await existingTemplate.save();

    res.json({
      message: 'Template updated successfully',
      template: {
        id: newTemplate._id,
        name: newTemplate.name,
        version: newTemplate.version
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const companyConn = await getCompanyConnection(companyId);
    const Template = companyConn.model('Template', TemplateSchema);

    const template = await Template.findOne({ _id: id, isActive: true });
    if (!template) {
      return res.status(404).json({
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    template.isActive = false;
    await template.save();

    res.json({
      message: 'Template deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const previewTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const { sampleData } = req.body;

    const companyConn = await getCompanyConnection(companyId);
    const Template = companyConn.model('Template', TemplateSchema);

    const template = await Template.findOne({ _id: id, isActive: true });
    if (!template) {
      return res.status(404).json({
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    // TODO: Implement delimiter replacement logic
    let previewHtml = template.htmlContent;
    
    if (sampleData) {
      Object.keys(sampleData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        previewHtml = previewHtml.replace(regex, sampleData[key]);
      });
    }

    res.json({
      preview: previewHtml
    });
  } catch (error) {
    next(error);
  }
};
