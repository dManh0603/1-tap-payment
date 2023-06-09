const User = require('../models/UserModel');
const Transaction = require('../models/TransactionModel');
const generateToken = require('../config/jwt');
const UserActivity = require('../models/UserActivityModel');
const Config = require('../models/ConfigModel');

class AdminController {

  async getMonthlyIncome() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const monthlyTransactions = await Transaction.find({
      "createdAt": { $gte: startDate.toISOString(), $lte: endDate.toISOString() },
    });

    let monthlyIncome = 0;
    monthlyTransactions.forEach((transaction) => {
      monthlyIncome += transaction.amount;
    });

    return monthlyIncome;
  }

  async getAnnualIncome() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    const startDate = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${currentYear}-12-31T23:59:59.999Z`);

    const yearlyTransactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    let annualIncome = 0;
    yearlyTransactions.forEach((transaction) => {
      annualIncome += transaction.amount;
    });

    return annualIncome;
  }

  async getTransactionCount() {
    const transaction = await Transaction.find();
    const transactionCount = transaction.length;
    return transactionCount;
  }

  index(req, res) {
    if (req.session && req.session.user) {
      return res.redirect('/dashboard');
    }
    return res.render('index', {
      layout: 'blank.hbs',
    });
  }

  getToken = async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email, role: "admin" });
      if (!user) {
        throw { statusCode: 401, message: "Wrong email or password!" };
      }

      const passwordMatched = await user.matchPassword(password)

      if (!passwordMatched) {
        throw { statusCode: 401, message: "Wrong password!" };
      }

      console.log(`Admin: ${user._id} get token successfully.`)
      res.status(200).json({
        message: 'Admin get token successfully',
        token: generateToken(user._id),

      });
    } catch (err) {
      console.error(err);
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal server error';
      res.status(statusCode).json({ message });
    }
  }

  getDashboard = async (req, res) => {
    try {
      // line chart
      const monthlyIncomePromise = this.getMonthlyIncome();
      const annualIncomePromise = this.getAnnualIncome();
      const transactionCountPromise = this.getTransactionCount();

      const [monthlyIncome, annualIncome, transactionCount] = await Promise.all([
        monthlyIncomePromise,
        annualIncomePromise,
        transactionCountPromise
      ]);

      //pie chart

      return res.status(200).json({ monthlyIncome, annualIncome, transactionCount });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  login = async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email, role: 'admin' });
      if (!user) {
        throw { statusCode: 401, message: "You have entered wrong email or password!" };
      }

      const passwordMatched = await user.matchPassword(password)

      if (!passwordMatched) {
        throw { statusCode: 401, message: "You have entered wrong password!" };

      }

      console.log(`User: ${user._id} logged in.`)
      res.status(200).json({
        message: 'User login successfully',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          balance: user.balance,
          token: generateToken(user._id)
        }
      });
    } catch (err) {
      console.error(err);
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal server error';
      res.status(statusCode).json({ message });
    }
  }

  getTransactions = async (req, res) => {
    try {
      const transactions = await Transaction.find();

      const userIds = transactions.map(transaction => transaction.user_id);
      const users = await User.find({ _id: { $in: userIds } });

      const transactionsWithUserEmail = transactions.map(transaction => {
        const user = users.find(user => user._id.toString() === transaction.user_id.toString());
        const email = user ? user.email : 'Unknown'; // Handle case where user is not found
        return {
          ...transaction.toObject(),
          email: email
        };
      });

      res.json({ transactions: transactionsWithUserEmail });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  getTransactionDetails = async (req, res) => {
    const transactionId = req.params.id;
    try {
      const transaction = await Transaction.findById(transactionId).lean().exec();
      console.log(transaction);

      const userId = transaction.user_id;
      const user = await User.findById(userId).select('-password -balance -card_uid').lean().exec();
      console.log(user);

      res.json({ transaction: transaction, user: user });
    } catch (error) {
      // Handle any errors that occur during the database operation
      console.error(error);
      res.status(500).json('Internal Server Error');
    }
  }

  getUsers = async (req, res) => {
    try {
      // Find all users with the role "client" and exclude the password field
      const users = await User.find({ role: { $ne: 'admin' } }).select('-password');

      return res.json(users);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });

    }
  }

  getUserDetails = async (req, res) => {
    const userId = req.params.id;
    try {
      const user = await User.findById(userId).lean().select('-password').exec();
      console.log(user);
      res.json(user);
    } catch (error) {
      console.log(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  updateUserDetails = async (req, res) => {
    const userId = req.params.id;
    const body = req.body;
    try {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (body.balance !== '') {
        user.balance = body.balance;
      }

      if (body.email !== '') {
        user.email = body.email;
      }

      if (body.name !== '') {
        user.name = body.name;
      }

      if (body.card_uid !== '') {
        user.card_uid = body.card_uid;
      }

      if (body.card_disabled !== undefined) {
        user.card_disabled = body.card_disabled;
      }

      // Save the updated user document
      await user.save();

      return res.json({ user: user, message: 'User details updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  getUserActivities = async (req, res) => {
    try {
      const activities = await UserActivity.find({}).sort({ timestamp: -1 }).lean().exec();
      res.json(activities);
    } catch (error) {
      console.error('Error retrieving user activities:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  async getMonthlyActivity(req, res) {
    try {
      const currentMonth = new Date().getMonth() + 1; // Get current month (1-12)
      const currentYear = new Date().getFullYear(); // Get current year

      const activityCounts = await UserActivity.aggregate([
        {
          $addFields: {
            month: { $month: '$timestamp' }, // Extract month from timestamp field
            year: { $year: '$timestamp' }, // Extract year from timestamp field
          },
        },
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$month', currentMonth] }, // Match the current month
                { $eq: ['$year', currentYear] }, // Match the current year
              ],
            },
          },
        },
        {
          $group: {
            _id: '$meta.type',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            type: '$_id',
            count: 1,
          },
        },
      ]).exec();

      res.json(activityCounts);
    } catch (error) {
      console.error('Error retrieving monthly activity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  getConfig = async (req, res) => {
    try {
      const config = await Config.findOne({}); // Fetch the configuration document
      if (!config) {
        console.error('No config document found');
        return;
      }

      res.json({
        motorbikePrice: config.motorbike_price,
        bicyclePrice: config.bicycle_price
      });
    } catch (error) {

      console.error('Error retrieving config:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  updateConfig = async (req, res) => {
    try {
      const { motorbikePrice, bicyclePrice } = req.body;

      const config = {
        motorbike_price: motorbikePrice,
        bicycle_price: bicyclePrice,
      };

      await Config.findOneAndUpdate({}, config);
      process.env.motorbikePrice = motorbikePrice;
      process.env.bicyclePrice = bicyclePrice;

      res.json({ message: 'Config updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update config' });
    }
  };


}

module.exports = new AdminController();
