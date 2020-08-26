// import AppError from '../errors/AppError';
import { getRepository, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getRepository(Transaction);
    const categoryRepository = getRepository(Category);
    const balance = getCustomRepository(TransactionRepository);
    const { total } = await balance.getBalance();

    const existsCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!existsCategory) {
      const newCategory = categoryRepository.create({
        title: category,
      });

      const createdCategory = await categoryRepository.save(newCategory);

      if (type === 'outcome' && total - value < 0) {
        throw new AppError('Insufficient balance', 400);
      }
      const newTransaction = transactionRepository.create({
        title,
        type,
        value,
        category_id: createdCategory.id,
      });

      await transactionRepository.save(newTransaction);

      return newTransaction;
    }
    if (type === 'outcome' && total - value < 0) {
      throw new AppError('Insufficient balance', 400);
    }
    const transaction = transactionRepository.create({
      title,
      type,
      value,
      category_id: existsCategory.id,
    });

    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
