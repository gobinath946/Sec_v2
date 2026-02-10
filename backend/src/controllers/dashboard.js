const Message = require('../models/model').Message;
const Customer = require('../models/model').Customer;
const Count = require('../models/model').Counts;
const User = require('../models/model').User;

const getDashBoardData = async (req, res) => {
    const customerId = req.query.customer_id;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate || new Date();

    if (!customerId) {
        return res.status(400).json({ error: 'customerId is Required' });
    }

    if (!fromDate || isNaN(Date.parse(fromDate))) {
        return res.status(400).json({ error: 'Invalid fromDate format or value' });
    }

    if (toDate && isNaN(Date.parse(toDate))) {
        return res.status(400).json({ error: 'Invalid toDate format or value' });
    }

    try {
        const customer = await Customer.findOne({ uid: customerId });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const fromDateObj = new Date(fromDate);
        const toDateObj = toDate ? new Date(toDate) : new Date();

        const counts = await Count.find({
            customer_id: customerId,
        });

        let totalSMSCount = 0;
        let totalEmailCount = 0;
        let totalCreditCount = 0;
        let totalPurchasedCount = 0;

        counts.forEach(count => {
            count.sms_counts.forEach(smsCount => {
                const countDate = new Date(smsCount.date);
                if (countDate >= fromDateObj && countDate <= toDateObj) {
                    totalSMSCount += smsCount.count;
                }
            });

            count.email_counts.forEach(emailCount => {
                const countDate = new Date(emailCount.date);
                if (countDate >= fromDateObj && countDate <= toDateObj) {
                    totalEmailCount += emailCount.count;
                }
            });

            count.credit_counts.forEach(creditCount => {
                const countDate = new Date(creditCount.date);
                if (countDate >= fromDateObj && countDate <= toDateObj) {
                    totalCreditCount += creditCount.count;
                }
            });

            count.purchased_counts.forEach(purchasedCount => {
                const countDate = new Date(purchasedCount.date);
                if (countDate >= fromDateObj && countDate <= toDateObj) {
                    totalPurchasedCount += purchasedCount.count;
                }
            });
        });
        
        const inProgressCount = await Message.countDocuments({
            customer_id: customerId,
            expired: false,
            created_at: {
                $gte: fromDateObj,
                $lt: new Date(toDateObj.getTime() + 86400000)
            }
        });
        
        const closedCount = await Message.countDocuments({
            customer_id: customerId,
            expired: true,
            created_at: {
                $gte: fromDateObj,
                $lt: new Date(toDateObj.getTime() + 86400000)
            }
        });
        
        const totalCount = await Message.countDocuments({
            customer_id: customerId,
            created_at: {
                $gte: fromDateObj,
                $lt: new Date(toDateObj.getTime() + 86400000)
            }
        });

        const messages = await Message.find({
            customer_id: customerId,
            created_at: { $gte: fromDateObj, $lt: new Date(toDateObj.getTime() + 86400000) }
        });

        let shortenLinkCount = 0;
        const uniqueShortenLinks = new Set();
        messages.forEach(message => {
            if (message.shorten_link && message.shorten_link.length > 0) {
                message.shorten_link.forEach(link => {
                    if (link.url) {
                        uniqueShortenLinks.add(link.url);
                    }
                });
            }
        });
        shortenLinkCount = uniqueShortenLinks.size;

        const valid_user = await User.findOne({ user_uid: customerId });
        const MasterCredits = valid_user.credits

        res.status(200).json({
            inProgress: inProgressCount, 
            closed: closedCount, 
            masterCount: totalCount, 
            shortenLinkCount: shortenLinkCount, 
            totalSMSCount: totalSMSCount,
            totalEmailCount: totalEmailCount, 
            totalCreditCount: totalCreditCount,
            totalPurchasedCount: totalPurchasedCount,
            MasterCredits: MasterCredits
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getDashBoardData: getDashBoardData
};
