import fs from 'fs';
import csv from 'csv-parse';
import { getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    const transactionsReadStream = fs.createReadStream(filePath);
    const parses = csv({
      from_line: 2,
    });
    const parseCSV = transactionsReadStream.pipe(parses);
    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );
      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });
    await new Promise(resolve => parseCSV.on('end', resolve));
    const categoryRepository = getRepository(Category);
    const existentCategory = await categoryRepository.find({
      title: In(categories),
    });

    const existentCategoryTitles = existentCategory.map(
      (category: Category) => category.title,
    );

    const addCategoriesTitles = categories
      .filter(category => !existentCategoryTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      addCategoriesTitles.map(title => ({
        title,
      })),
    );
    await categoryRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategory];

    const transactionsRepository = getRepository(Transaction);

    const createTransaction = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await transactionsRepository.save(createTransaction);
    await fs.promises.unlink(filePath);
    return createTransaction;
  }
}

export default ImportTransactionsService;
