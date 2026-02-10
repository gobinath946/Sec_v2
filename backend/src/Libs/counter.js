const Counts = require("../models/model").Counts;

async function counter(customer_id, type, value) {
    try {
        const currentDate = new Date().toISOString().split('T')[0];
        let countsDoc = await Counts.findOne({ customer_id: customer_id });
        if (!countsDoc) {
            countsDoc = await Counts.create({
                customer_id: customer_id,
                [`${type}`]: (type === 'purchased_counts') ? [{ date: currentDate, count: value }] : [{ date: currentDate, count: 1 }]
            });
        } else {
            if (type === 'purchased_counts') {
                countsDoc[`${type}`].push({ date: new Date(currentDate), count: value });
            } else {
                const todayEntryIndex = countsDoc[`${type}`].findIndex(entry => entry.date.toISOString().split('T')[0] === currentDate);
                if (todayEntryIndex !== -1) {
                    countsDoc[`${type}`][todayEntryIndex].count += 1;
                } else {
                    countsDoc[`${type}`].push({ date: new Date(currentDate), count: 1 });
                }
            }
            await countsDoc.save();
        }
    } catch (error) {
        console.log(error);
        throw new Error(`Failed to update ${type} count: ${error.message}`);
    }
}

module.exports = counter;
