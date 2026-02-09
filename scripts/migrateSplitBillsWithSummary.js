const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const migrateSplitBillsWithSummary = async () => {
  await connectDB();

  try {
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();
    
    const tenantDbs = databases.filter(db => db.name.startsWith('restaurant_'));
    
    console.log(`Found ${tenantDbs.length} tenant databases`);

    for (const dbInfo of tenantDbs) {
      const dbName = dbInfo.name;
      console.log(`\nProcessing database: ${dbName}`);
      
      const tenantConn = mongoose.createConnection(
        process.env.MONGODB_URI.replace('/restaurant-saas', `/${dbName}`)
      );

      await tenantConn.asPromise();

      const SplitBill = tenantConn.model('splitbills', new mongoose.Schema({}, { strict: false }));
      const Order = tenantConn.model('orders', new mongoose.Schema({}, { strict: false }));

      const splitBills = await SplitBill.find({});
      console.log(`Found ${splitBills.length} split bills`);

      let updated = 0;
      for (const splitBill of splitBills) {
        const order = await Order.findById(splitBill.originalOrderId);
        
        if (order) {
          // Create summary from split bill
          const splitSummary = splitBill.splits.map(split => ({
            splitNumber: split.splitNumber,
            customerName: split.customerName,
            totalAmount: split.totalAmount,
            paymentStatus: split.paymentStatus || 'PENDING',
            paymentMethod: split.paymentDetails?.method,
            paidAt: split.paymentDetails?.paidAt
          }));

          await Order.findByIdAndUpdate(splitBill.originalOrderId, {
            hasSplitBill: true,
            splitBillId: splitBill._id,
            splitBillSummary: splitSummary
          });
          
          updated++;
          console.log(`✓ Updated order ${order.orderNumber} with ${splitSummary.length} splits`);
        }
      }

      console.log(`Updated ${updated} orders in ${dbName}`);
      await tenantConn.close();
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateSplitBillsWithSummary();
