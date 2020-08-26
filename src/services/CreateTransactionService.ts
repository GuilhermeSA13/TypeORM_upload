// import AppError from '../errors/AppError';
import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

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

    const existsCategory = await categoryRepository.findOne({
      where: { title: category.toUpperCase() },
    });

    if (!existsCategory) {
      const newCategory = categoryRepository.create({
        title: category.toUpperCase(),
      });

      const createdCategory = await categoryRepository.save(newCategory);

      const newTransaction = transactionRepository.create({
        title,
        type,
        value,
        category_id: createdCategory.id,
      });

      await transactionRepository.save(newTransaction);

      return newTransaction;
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
