const transactionModel = require("../models/transaction.model");

const ledgerModel = require("../models/ledger.model");
const emailService = require("../email.service");
const accountModel = require("../models/account.model");
const mongoose = require("mongoose");

//create a new transaction
/**
 * 10-STEPS
 * 1. Validate request
 * 2. Validate idempotency key (to prevent duplicate transactions)
 * 3. check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction with pending status
 * 6. Create ledger entry for sender with debit amount
 * 7.Create ledger entry for receiver with credit amount
 * 8. Update transaction status to completed
 * 9.Commit mongodb sesssion
 * 10.send email notifications
 *
 *
 */

//controller
async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  //1. Validate request
  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const senderAccount = await accountModel.findById(fromAccount);
  const receiverAccount = await accountModel.findById(toAccount);

  if (!senderAccount || !receiverAccount) {
    return res.status(404).json({ message: "Account not found" });
  }

  if (
    senderAccount.status !== "active" ||
    receiverAccount.status !== "active"
  ) {
    return res.status(400).json({ message: "Both accounts must be active" });
  }

  //2. Validate idempotency key (to prevent duplicate transactions)
  const existingTransaction = await transactionModel.findOne({
    idempotencyKey,
  });
  if (existingTransaction) {
    if (existingTransaction.status === "completed") {
      return res
        .status(200)
        .json({
          message: "Transaction already completed",
          transaction: existingTransaction,
        });
    }
    if (existingTransaction.status === "pending") {
      return res
        .status(200)
        .json({
          message: "Transaction is pending",
          transaction: existingTransaction,
        });
    }
    if (existingTransaction.status === "failed") {
      return res
        .status(200)
        .json({
          message: "Transaction already failed",
          transaction: existingTransaction,
        });
    }
  }

  //3. check account status
  if (
    senderAccount.status !== "active" ||
    receiverAccount.status !== "active"
  ) {
    return res.status(400).json({ message: "Both accounts must be active" });
  }

  //4. Derive sender balance from ledger
  const balance = await senderAccount.getBalance();

  if (balance < amount) {
    return res
      .status(400)
      .json({
        message: `Insufficient balance. Current balance is ${balance}.Required balance is ${amount}`,
      });
  }

  //5. Create transaction with pending status
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = await transactionModel.create(
      [
        {
          fromAccount,
          toAccount,
          amount,
          idempotencyKey,
          status: "pending",
        },
      ],
      { session },
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .json({ message: "Transaction failed", error: error.message });
  }

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromAccount,
        amount: amount,
        type: "debit",
      },
    ],
    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        type: "credit",
      },
    ],
    { session },
  );

  try {
    transaction.status = "completed";
    await transaction.save({ session });
    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .json({ message: "Transaction failed", error: error.message });
  }

  //10.send email notifications
  try {
    await emailService.sendTransactionEmail(
      senderAccount.user.email,
      senderAccount.user.name,
      amount,
      fromAccount,
      toAccount,
    );
    await emailService.sendTransactionEmail(
      receiverAccount.user.email,
      receiverAccount.user.name,
      amount,
      fromAccount,
      toAccount,
    );
  } catch (error) {
    console.error("Error sending email notifications:", error);
  }

  return res
    .status(200)
    .json({ message: "Transaction completed successfully", transaction });
}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  //1. Validate request
  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const receiverAccount = await accountModel.findById(toAccount);

  if (!receiverAccount) {
    return res.status(404).json({ message: "Receiver account not found" });
  }

  if (receiverAccount.status !== "active") {
    return res.status(400).json({ message: "Receiver account must be active" });
  }

  const systemUser = await userModel.findOne({ systemUser: true }); //system user ko database me se find karega, jiska systemUser field true hoga, iska matlab hai ki wo user ek system user hai, jiska use hum internal operations ke liye kar sakte hain, jaise ki automated processes ya background tasks ke liye

  if (!systemUser) {
    return res.status(500).json({ message: "System user not found" });
  }

  const fromAccount = await accountModel.findOne({ user: systemUser._id }); //system user ke liye account ko database me se find karega, jisme user field system user ke id ke barabar hoga

  if (!fromAccount) {
    return res.status(500).json({ message: "System account not found" });
  }

  //3. check account status
  if (fromAccount.status !== "active" || receiverAccount.status !== "active") {
    return res.status(400).json({ message: "Both accounts must be active" });
  }

  //2. Validate idempotency key (to prevent duplicate transactions)
  const existingTransaction = await transactionModel.findOne({
    idempotencyKey,
  });
  if (existingTransaction) {
    if (existingTransaction.status === "completed") {
      return res
        .status(200)
        .json({
          message: "Transaction already completed",
          transaction: existingTransaction,
        });
    }
    if (existingTransaction.status === "pending") {
      return res
        .status(200)
        .json({
          message: "Transaction is pending",
          transaction: existingTransaction,
        });
    }
    if (existingTransaction.status === "failed") {
      return res
        .status(200)
        .json({
          message: "Transaction already failed",
          transaction: existingTransaction,
        });
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = await transactionModel.create(
      [
        {
          fromAccount: fromAccount._id,
          toAccount: receiverAccount._id,
          amount,
          idempotencyKey,
          status: "pending",
        },
      ],
      { session },
    );
    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromAccount._id,
          amount: amount,
          type: "debit",
        },
      ],
      { session },
    );

    await (() => {
      return new Promise((resolve) => setTimeout(resolve, 10 * 1000)); //ye function ek promise return karega jo 10 second ke baad resolve hoga, isse hum simulate kar sakte hain ki transaction process hone me thoda time lagta hai, jisse hum dekh sakte hain ki idempotency key kaise kaam karti hai jab transaction process hone me time lagta hai
    });

    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: receiverAccount._id,
          amount: amount,
          type: "credit",
        },
      ],
      { session },
    );

    transaction.status = "completed";
    await transaction.save({ session });
    await session.commitTransaction();
    session.endSession();

    //10.send email notifications
    try {
      await emailService.sendTransactionEmail(
        fromAccount.user.email,
        fromAccount.user.name,
        amount,
        fromAccount._id,
        receiverAccount._id,
      );
      await emailService.sendTransactionEmail(
        receiverAccount.user.email,
        receiverAccount.user.name,
        amount,
        fromAccount._id,
        receiverAccount._id,
      );
    } catch (error) {
      console.error("Error sending email notifications:", error);
    }

    return res
      .status(200)
      .json({
        message: "Initial funds transaction completed successfully",
        transaction,
      });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .json({ message: "Transaction failed", error: error.message });
  }
}
module.exports = {
  createTransaction,
  createInitialFundsTransaction,
};
