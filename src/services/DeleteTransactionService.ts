import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionRepository = getRepository(Transaction);
    const transaction = await transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }
    await transactionRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
