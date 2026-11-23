import { BaseEntity } from './BaseEntity';
import { ValidationError } from '../exceptions';

export interface ExpenseReceiptProps {
  id: string;
  expenseId: string;
  expenseItemId?: string;
  originalFileName: string;
  storedFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileHash: string;
  ocrExtractedText?: string;
  ocrExtractedAmount?: number;
  ocrExtractedDate?: Date;
  ocrExtractedCnpj?: string;
  isVerified?: boolean;
  uploadedById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ExpenseReceipt extends BaseEntity {
  private _expenseId: string;
  private _expenseItemId?: string;
  private _originalFileName: string;
  private _storedFileName: string;
  private _filePath: string;
  private _fileSize: number;
  private _mimeType: string;
  private _fileHash: string;
  private _ocrExtractedText?: string;
  private _ocrExtractedAmount?: number;
  private _ocrExtractedDate?: Date;
  private _ocrExtractedCnpj?: string;
  private _isVerified: boolean;
  private _uploadedById: string;

  constructor(props: ExpenseReceiptProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.filePath || props.filePath.trim().length === 0) {
      throw new ValidationError('Caminho do arquivo do comprovante é obrigatório');
    }
    if (!props.fileHash || props.fileHash.trim().length === 0) {
      throw new ValidationError('Hash do arquivo é obrigatório para garantir integridade e deduplicação');
    }

    this._expenseId = props.expenseId;
    this._expenseItemId = props.expenseItemId;
    this._originalFileName = props.originalFileName;
    this._storedFileName = props.storedFileName;
    this._filePath = props.filePath;
    this._fileSize = props.fileSize;
    this._mimeType = props.mimeType;
    this._fileHash = props.fileHash;
    this._ocrExtractedText = props.ocrExtractedText;
    this._ocrExtractedAmount = props.ocrExtractedAmount;
    this._ocrExtractedDate = props.ocrExtractedDate ? new Date(props.ocrExtractedDate) : undefined;
    this._ocrExtractedCnpj = props.ocrExtractedCnpj;
    this._isVerified = props.isVerified || false;
    this._uploadedById = props.uploadedById;
  }

  public get expenseId(): string {
    return this._expenseId;
  }

  public get expenseItemId(): string | undefined {
    return this._expenseItemId;
  }

  public get originalFileName(): string {
    return this._originalFileName;
  }

  public get storedFileName(): string {
    return this._storedFileName;
  }

  public get filePath(): string {
    return this._filePath;
  }

  public get fileSize(): number {
    return this._fileSize;
  }

  public get mimeType(): string {
    return this._mimeType;
  }

  public get fileHash(): string {
    return this._fileHash;
  }

  public get ocrExtractedText(): string | undefined {
    return this._ocrExtractedText;
  }

  public get ocrExtractedAmount(): number | undefined {
    return this._ocrExtractedAmount;
  }

  public get ocrExtractedDate(): Date | undefined {
    return this._ocrExtractedDate;
  }

  public get ocrExtractedCnpj(): string | undefined {
    return this._ocrExtractedCnpj;
  }

  public get isVerified(): boolean {
    return this._isVerified;
  }

  public get uploadedById(): string {
    return this._uploadedById;
  }

  public attachToItem(itemId: string): void {
    this._expenseItemId = itemId;
    this.touch();
  }

  public updateOcrData(data: {
    text?: string;
    amount?: number;
    date?: Date;
    cnpj?: string;
  }): void {
    if (data.text !== undefined) this._ocrExtractedText = data.text;
    if (data.amount !== undefined) this._ocrExtractedAmount = data.amount;
    if (data.date !== undefined) this._ocrExtractedDate = data.date;
    if (data.cnpj !== undefined) this._ocrExtractedCnpj = data.cnpj;
    this.touch();
  }

  public markAsVerified(): void {
    this._isVerified = true;
    this.touch();
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      expenseId: this._expenseId,
      expenseItemId: this._expenseItemId,
      originalFileName: this._originalFileName,
      storedFileName: this._storedFileName,
      filePath: this._filePath,
      fileSize: this._fileSize,
      mimeType: this._mimeType,
      fileHash: this._fileHash,
      ocrExtractedText: this._ocrExtractedText,
      ocrExtractedAmount: this._ocrExtractedAmount,
      ocrExtractedDate: this._ocrExtractedDate,
      ocrExtractedCnpj: this._ocrExtractedCnpj,
      isVerified: this._isVerified,
      uploadedById: this._uploadedById,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
