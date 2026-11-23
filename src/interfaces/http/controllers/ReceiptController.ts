import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { IExpenseReceiptRepository } from '../../../infrastructure/repositories/IExpenseReceiptRepository';
import { IExpenseRepository } from '../../../infrastructure/repositories/IExpenseRepository';
import { ExpenseReceipt } from '../../../domain/entities/ExpenseReceipt';
import { ReceiptOcrProcessor } from '../../../infrastructure/ocr/ReceiptOcrProcessor';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../domain/exceptions';

export class ReceiptController {
  constructor(
    private readonly receiptRepository: IExpenseReceiptRepository,
    private readonly expenseRepository: IExpenseRepository
  ) {}

  public upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError('Nenhum arquivo enviado');
      }

      const expenseId = req.params.expenseId;
      const expense = await this.expenseRepository.findWithDetails(expenseId);
      if (!expense) {
        throw new NotFoundError('Relatório de Despesa', expenseId);
      }

      if (expense.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
        throw new ForbiddenError('Apenas o solicitante pode anexar comprovantes a esta despesa');
      }

      const fileBuffer = fs.readFileSync(req.file.path);
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Deduplicação inteligente de comprovante
      const duplicate = await this.receiptRepository.findByFileHash(fileHash);
      if (duplicate && duplicate.expenseId !== expenseId) {
        throw new ValidationError('Este mesmo comprovante fiscal já foi utilizado em outro relatório de despesa');
      }

      // Executa OCR inteligente
      const ocrData = await ReceiptOcrProcessor.processReceipt(req.file.originalname, fileBuffer);

      const receipt = new ExpenseReceipt({
        id: uuidv4(),
        expenseId,
        expenseItemId: req.body.expenseItemId || undefined,
        originalFileName: req.file.originalname,
        storedFileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileHash,
        ocrExtractedText: ocrData.text,
        ocrExtractedAmount: ocrData.amount,
        ocrExtractedDate: ocrData.date,
        ocrExtractedCnpj: ocrData.cnpj,
        uploadedById: req.user!.userId,
      });

      const saved = await this.receiptRepository.save(receipt);
      res.status(201).json({ success: true, data: saved.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  public getByExpenseId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const receipts = await this.receiptRepository.findByExpenseId(req.params.expenseId);
      res.status(200).json({ success: true, data: receipts.map((r) => r.toJSON()) });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const receipt = await this.receiptRepository.findById(req.params.id);
      if (!receipt) {
        throw new NotFoundError('Comprovante', req.params.id);
      }

      if (receipt.uploadedById !== req.user!.userId && req.user!.role !== 'ADMIN') {
        throw new ForbiddenError('Permissão negada para excluir este comprovante');
      }

      await this.receiptRepository.delete(req.params.id);

      // Remove arquivo do disco
      if (fs.existsSync(receipt.filePath)) {
        fs.unlinkSync(receipt.filePath);
      }

      res.status(200).json({ success: true, message: 'Comprovante removido com sucesso' });
    } catch (error) {
      next(error);
    }
  };
}
