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

const migrateSplitBills = async () => {
  await connectDB();

  try {
    // Get all tenant databases
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

      // Get split bills collection
      const SplitBill = tenantConn.model('splitbills', new mongoose.Schema({}, { strict: false }));
      const Order = tenantConn.model('orders', new mongoose.Schema({}, { strict: false }));

      const splitBills = await SplitBill.find({});
      console.log(`Found ${splitBills.length} split bills`);

      let updated = 0;
      for (const splitBill of splitBills) {
        const order = await Order.findById(splitBill.originalOrderId);
        
        if (order && !order.hasSplitBill) {
          await Order.findByIdAndUpdate(splitBill.originalOrderId, {
            hasSplitBill: true,
            splitBillId: splitBill._id
          });
          updated++;
          console.log(`✓ Updated order ${order.orderNumber}`);
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

migrateSplitBills();
