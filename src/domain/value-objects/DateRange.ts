import { ValidationError } from '../exceptions';

export class DateRange {
  private readonly _startDate: Date;
  private readonly _endDate: Date;

  constructor(startDate: Date | string, endDate: Date | string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      throw new ValidationError('Data inicial inválida');
    }
    if (isNaN(end.getTime())) {
      throw new ValidationError('Data final inválida');
    }
    if (start > end) {
      throw new ValidationError('A data inicial não pode ser posterior à data final');
    }

    this._startDate = start;
    this._endDate = end;
  }

  public get startDate(): Date {
    return new Date(this._startDate.getTime());
  }

  public get endDate(): Date {
    return new Date(this._endDate.getTime());
  }

  public get durationInDays(): number {
    const diffTime = Math.abs(this._endDate.getTime() - this._startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  public contains(date: Date | string): boolean {
    const target = new Date(date);
    return target >= this._startDate && target <= this._endDate;
  }

  public overlaps(other: DateRange): boolean {
    return this._startDate <= other._endDate && this._endDate >= other._startDate;
  }
}
