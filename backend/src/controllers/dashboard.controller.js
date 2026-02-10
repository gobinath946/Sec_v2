import { getCompanyConnection } from '../config/database.js';
import DocumentSchema from '../models/company/Document.model.js';

export const getStats = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    
    const companyConn = await getCompanyConnection(companyId);
    const Document = companyConn.model('Document', DocumentSchema);

    const totalDocuments = await Document.countDocuments();
    const pendingDocuments = await Document.countDocuments({ 
      status: { $in: ['pending', 'in_progress'] } 
    });
    const completedDocuments = await Document.countDocuments({ 
      status: 'completed' 
    });

    // Get recent activity (last 10 documents)
    const recentActivity = await Document.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('sessionId status createdAt completedAt');

    res.json({
      stats: {
        totalDocuments,
        pendingDocuments,
        completedDocuments
      },
      recentActivity: recentActivity.map(doc => ({
        sessionId: doc.sessionId,
        status: doc.status,
        createdAt: doc.createdAt,
        completedAt: doc.completedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};
